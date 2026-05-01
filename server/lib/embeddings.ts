import { OpenRouter } from "@openrouter/sdk"
import hash from "object-hash"
import { db } from "../database.ts"
import { env } from "../env.ts"
import type { EmbeddingType } from "../generated/prisma/enums.ts"

const openrouterInternal = new OpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
})

/**
 * In memory embedding representation.
 */
export type Embedding = { hash: Uint8Array<ArrayBuffer>; embedding: Float32Array }

type PendingEmbedding = {
	value: EmbedMultimodalDocument
	sourceHash: Uint8Array
	resolve: (e: Embedding) => void
	reject: (err: unknown) => void
}

const embeddingQueue: PendingEmbedding[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
const BATCH_SIZE = 16
async function flushEmbeddingQueue() {
	flushTimer = null
	while (embeddingQueue.length > 0) {
		const batch = embeddingQueue.splice(0, BATCH_SIZE)
		await processBatch(batch)
	}
}

async function processBatch(batch: PendingEmbedding[]) {
	if (batch.length === 0) return

	let vectors: (number[] | string)[]
	try {
		const response = await openrouterInternal.embeddings.generate({
			requestBody: {
				encodingFormat: "float",
				model: "perplexity/pplx-embed-v1-4b",
				dimensions: 1536,
				input: batch.map((value) => value.value),
			},
		})
		if (typeof response === "string") throw Error("Improper embedding response.")
		vectors = response.data.map((d) => d.embedding)
	} catch (err) {
		batch.forEach((item) => void item.reject(err))
		return
	}

	await Promise.all(
		batch.map(async (item, i) => {
			const embedding = vectors[i]
			if (typeof embedding === "string") {
				item.reject(Error("Improper embedding response."))
				return
			}
			try {
				await db.$executeRaw`
                    INSERT INTO "Embedding" (hash, embedding)
                    VALUES (${item.sourceHash}, ${`[${embedding.join(",")}]`}::vector)
                    ON CONFLICT (hash) DO UPDATE SET embedding = EXCLUDED.embedding
                `
				item.resolve({
					hash: Uint8Array.from(item.sourceHash),
					embedding: Float32Array.from(embedding),
				})
			} catch (err) {
				item.reject(err)
			}
		})
	)
}

async function getEmbedding(value: EmbedMultimodalDocument): Promise<Embedding | null> {
	const sourceHash = hash(value, { algorithm: "md5", encoding: "buffer" })
	const rows = await db.$queryRaw<{ embedding: string }[]>`
        SELECT embedding::text
        FROM "Embedding"
        WHERE hash = ${sourceHash}
        LIMIT 1
    `
	if (rows.length === 0) return null
	const embedding = JSON.parse(rows[0].embedding) as number[]
	return {
		hash: Uint8Array.from(sourceHash),
		embedding: Float32Array.from(embedding),
	}
}

function setEmbedding(value: EmbedMultimodalDocument): Promise<Embedding> {
	return new Promise((resolve, reject) => {
		const sourceHash: Uint8Array = hash(value, { algorithm: "md5", encoding: "buffer" })
		embeddingQueue.push({ value, sourceHash, resolve, reject })
		if (flushTimer === null) flushTimer = setTimeout(flushEmbeddingQueue, 80)
	})
}

export type DocumentTextPiece = { type: "text"; text: string }
export type EmbedMultimodalDocument = string

/**
 * Get the embedding for a prechunked string.
 * @param value Some prechunked content.
 * @param type The type of embedding.
 */
export async function embedOne(
	value: EmbedMultimodalDocument,
	type: EmbeddingType
): Promise<Embedding> {
	const embedding = (await getEmbedding(value)) ?? (await setEmbedding(value))
	await db.embedding.updateMany({
		where: { hash: embedding.hash, AND: { NOT: { type: { has: type } } } },
		data: { type: { push: type } },
	})
	return embedding
}

export function truncate(embedding: Embedding): Embedding {
	embedding.embedding.slice(0, 768)
	return {
		hash: embedding.hash,
		embedding: embedding.embedding.slice(0, 768),
	}
}
