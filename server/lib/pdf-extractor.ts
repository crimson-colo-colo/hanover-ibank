import fs from "node:fs"
import * as os from "node:os"
import path from "node:path"
import { Worker } from "node:worker_threads"
import * as Comlink from "comlink"
import nodeAdapter from "comlink/dist/esm/node-adapter"
import { fileTypeFromBuffer } from "file-type"
import ObjHash from "object-hash"
import z from "zod"
import { db } from "../database.ts"
import { env } from "../env.ts"
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
export async function toMarkdown(blob: Blob, filename: undefined): Promise<undefined>
export async function toMarkdown(blob: Blob, filename: string): Promise<string | undefined>
export async function toMarkdown(
	blob: Blob,
	filename: string | undefined
): Promise<string | undefined>
export async function toMarkdown(
	blob: Blob,
	filename: string | undefined
): Promise<string | undefined> {
	if (filename === undefined) return undefined
	const Response = z.object({
		success: z.boolean(),
		result: z.array(
			z.discriminatedUnion("format", [
				z.object({
					id: z.string(),
					name: z.string(),
					mimeType: z.string(),
					format: z.literal("markdown"),
					tokens: z.number(),
					data: z.string(),
				}),
				z.object({
					id: z.string(),
					name: z.string(),
					mimeType: z.string(),
					format: z.literal("error"),
					error: z.string(),
				}),
			])
		),
	})

	console.log("extracting:")

	const formData = new FormData()
	formData.append("files", blob, filename)
	let markdown: z.infer<typeof Response> | undefined
	try {
		const response = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${env.WORKERS_AI_ACCOUNT_ID}/ai/tomarkdown`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.WORKERS_AI_API_KEY}`,
				},
				body: formData,
			}
		)
		const json = await response.json()
		console.log("json", json, formData)
		try {
			markdown = Response.parse(json)
		} catch (e) {
			console.error(e, json)
			return undefined
		}
	} catch (e) {
		console.error(e)
		return undefined
	}
	console.log(markdown)
	if (markdown?.success) {
		const result = markdown.result.at(0)
		if (result?.format === "markdown") {
			return result.data
		} else {
			return undefined
		}
	}

	return undefined
}

/**
 * Convert a pdf buffer to a string. This is a very expensive function to call, but it also memoizes its results to the database.
 * @param buffer the pdf buffer
 * @param settings extra settings, changing these will cause a cache miss
 */
export async function pdfText(
	buffer: ArrayBuffer,
	settings: RecognitionSettings = { skipRecPDFTextNative: false, skipRecPDFTextOCR: false }
): Promise<string | undefined> {
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

	if (entry !== null) return entry.text

	const out = await fileTypeFromBuffer(buffer)
	const blob = new Blob([buffer], { type: out?.mime })
	return await toMarkdown(blob, out?.ext)
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
