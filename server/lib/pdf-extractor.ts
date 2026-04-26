import path from "node:path"
import { Worker } from "node:worker_threads"

const POOL_SIZE = 2

type Job = {
	buffer: ArrayBuffer
	resolve: (text: string) => void
	reject: (err: Error) => void
}

type PoolWorker = Worker & {
	_resolve?: (text: string) => void
	_reject?: (err: Error) => void
	busy: boolean
}

const pool: PoolWorker[] = []
const queue: Job[] = []

function dispatch(worker: PoolWorker, job: Job) {
	worker.busy = true
	worker._resolve = job.resolve
	worker._reject = job.reject
	worker.postMessage(job.buffer, [job.buffer])
}

for (let i = 0; i < POOL_SIZE; i++) {
	const worker = new Worker(path.resolve(import.meta.dirname, "pdf-worker.ts"), {
		stderr: true,
		stdout: true,
		stdin: false,
	}) as PoolWorker
	worker.busy = true // busy until ready signal received

	worker.on("message", (msg: { ready?: boolean; ok?: boolean; text?: string; error?: string }) => {
		if (msg.ready) {
			worker.busy = false
			const next = queue.shift()
			if (next) dispatch(worker, next)
			return
		}

		const resolve = worker._resolve!
		const reject = worker._reject!
		worker._resolve = undefined
		worker._reject = undefined
		worker.busy = false

		const next = queue.shift()
		if (next) dispatch(worker, next)

		if (msg.ok) resolve(msg.text!)
		else reject(new Error(msg.error))
	})

	worker.on("error", (err) => {
		// @ts-expect-error
		worker._reject?.(err)
		worker._resolve = undefined
		worker._reject = undefined
		worker.busy = false
	})

	pool.push(worker)
}

export function pdfText(buffer: ArrayBuffer): Promise<string> {
	return new Promise((resolve, reject) => {
		const free = pool.find((w) => !w.busy)
		const job: Job = { buffer, resolve, reject }
		if (free) dispatch(free, job)
		else queue.push(job)
	})
}
