import path from "node:path"
import { Worker } from "node:worker_threads"
import * as Comlink from "comlink"
import nodeAdapter from "comlink/dist/esm/node-adapter"
import ObjHash from "object-hash"
import { db } from "../database.ts"
import type { JobOptions, JobResult, PDFWorker, RecognitionSettings } from "./pdf.worker.ts"

const POOL_SIZE = 3

type PoolWorker = {
	w: Worker
	worker: Comlink.Remote<PDFWorker>
	job: Promise<JobResult> | null
}

type Job = {
	hash: Uint8Array<ArrayBuffer>
	payload: JobOptions
	resolve: (value: string) => void
	reject: (reason: string) => void
}

const pool: PoolWorker[] = []
const queue: Job[] = []

function dispatch(worker: PoolWorker, job: Job) {
	worker.job = worker.worker.extractText(job.payload)
	worker.job.then(async (result) => {
		if (!result.ok) {
			console.error("Error extracting PDF text:", result.error)
			job.reject(result.error)
			return
		}

		await insertCache(result.ok ? result.text : "", job.hash, job.payload.settings)
		job.resolve(result.text)
		worker.job = null
		const next = queue.shift()
		if (next) {
			dispatch(worker, next)
		} else {
			worker.worker[Comlink.releaseProxy]()
			worker.w.terminate()
			pool.splice(pool.indexOf(worker), 1)
		}
	})
}

function getIdleWorker(): PoolWorker | null {
	const existing = pool.find((worker) => worker.job === null)
	if (existing) {
		return existing
	}

	if (pool.length < POOL_SIZE) {
		const w = new Worker(path.resolve(import.meta.dirname, "pdf.worker.ts"), {})
		const worker = Comlink.wrap<PDFWorker>(nodeAdapter(w))
		const poolWorker = { w, worker, job: null }
		pool.push(poolWorker)
		return poolWorker
	}

	return null
}

/**
 * Convert a pdf buffer to a string. This is a very expensive function to call, but it also memoizes its results to the database.
 * @param buffer the pdf buffer
 * @param settings extra settings, changing these will cause a cache miss
 */
export async function pdfText(
	buffer: ArrayBuffer,
	settings: RecognitionSettings = { skipRecPDFTextNative: false, skipRecPDFTextOCR: false }
): Promise<string> {
	const hash: Uint8Array<ArrayBuffer> = Uint8Array.from(
		ObjHash(buffer, { algorithm: "md5", encoding: "buffer" })
	)

	const entry = await db.textExtractionCache.findUnique({
		where: {
			hash_skipRecPDFTextNative_skipRecPDFTextOCR: {
				hash,
				skipRecPDFTextNative: settings.skipRecPDFTextNative,
				skipRecPDFTextOCR: settings.skipRecPDFTextOCR,
			},
		},
	})

	if (entry !== null) {
		return entry.text
	}

	return new Promise((resolve, reject) => {
		const job: Job = {
			hash,
			payload: { buffer, settings },
			resolve,
			reject,
		}
		const idleWorker = getIdleWorker()
		if (idleWorker) {
			dispatch(idleWorker, job)
		} else {
			queue.push(job)
		}
	})
}

async function insertCache(
	text: string,
	hash: Uint8Array<ArrayBuffer>,
	settings: RecognitionSettings
) {
	await db.textExtractionCache.create({
		data: {
			hash,
			text,
			skipRecPDFTextNative: settings.skipRecPDFTextNative,
			skipRecPDFTextOCR: settings.skipRecPDFTextOCR,
		},
	})
}
