import { RecursiveChunker } from "@chonkiejs/core"
import { OpenRouter } from "@openrouter/sdk"
import { z } from "zod"
export type ImageUrl = {
	url: string
}
export type ContentImageURL = {
	imageUrl: ImageUrl
	type: "image_url"
}
export type ContentText = {
	text: string
	type: "text"
}
export type Content = ContentText | ContentImageURL

import hash from "object-hash"
import { db } from "../database.ts"
import { env } from "../env.ts"
import type { EmbeddingType } from "../generated/prisma/enums.ts"

const openrouterInternal = new OpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
})
export type Embedding = { hash: Uint8Array<ArrayBuffer>; embedding: Float32Array }

export async function shouldShowImages(query: string) {
	const classificationPrompt = `You classify search queries by how much the user wants image results.

The user is searching a knowledge base of documents, files, images, videos, and URLs.

Respond with exactly one word:
- NONE — the user clearly wants text, facts, or written content
- MAYBE — the user might want some images mixed in, or it is unclear
- YES — the user clearly wants visual content

When in doubt, respond MAYBE.

Examples:
Query: how do I reset my password
NONE

Query: what is the refund policy
NONE

Query: show me the office floor plan
YES

Query: photos from the team retreat
YES

Query: quarterly report
NONE

Query: logo designs
YES

Query: onboarding process
MAYBE

Query: marketing materials
MAYBE

Query: contract for project X
NONE

Query: what does the new dashboard look like
YES`
	try {
		const response = await openrouter.chat.send({
			chatRequest: {
				models: [
					"mistralai/ministral-3b-2512",
					"mistralai/mixtral-8x7b-instruct",
					"google/gemma-3-4b-it",
				],
				provider: { requireParameters: true, preferredMaxLatency: 0.5 },
				temperature: 0,
				messages: [
					{
						role: "system",
						content: classificationPrompt,
					},
					{
						role: "user",
						content: `${query}`,
					},
				],
				stop: ["NONE", "MAYBE", "YES"],
				maxTokens: 5,
			},
		})
		const rawModelText = z.string().parse(response.choices[0].message.content)
		const cleanedModelText = rawModelText.toUpperCase().trim()
		return z.enum(["NONE", "MAYBE", "YES"]).parse(cleanedModelText)
	} catch (e) {
		return "MAYBE"
	}
}

export async function getEmbedding(value: EmbedMultimodalDocument): Promise<Embedding | null> {
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
				model: "google/gemini-embedding-2-preview",
				dimensions: 2048,
				input: batch.map((item) => ({
					content: item.value.map((value) => {
						if (value.type === "text")
							return { type: "text", text: value.text } satisfies ContentText | ContentImageURL
						else
							return {
								type: "image_url",
								imageUrl: {
									url: `data:image/jpeg;base64,${Buffer.from(value.image).toString("base64")}`,
								},
							} satisfies ContentText | ContentImageURL
					}),
				})),
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

function setEmbedding(value: EmbedMultimodalDocument): Promise<Embedding> {
	return new Promise((resolve, reject) => {
		const sourceHash: Uint8Array = hash(value, { algorithm: "md5", encoding: "buffer" })
		embeddingQueue.push({ value, sourceHash, resolve, reject })
		if (flushTimer === null) flushTimer = setTimeout(flushEmbeddingQueue, 80)
	})
}

const chunker = await RecursiveChunker.create({
	tokenizer: "character",
	chunkSize: 6000,
	minCharactersPerChunk: 24,
})

export type DocumentTextPeice = { type: "text"; text: string }
export type DocumentImagePeice = { type: "image"; image: Uint8Array<ArrayBufferLike> }
export type EmbedMultimodalDocument = (DocumentTextPeice | DocumentImagePeice)[]

async function embedOne(value: EmbedMultimodalDocument, type: EmbeddingType): Promise<Embedding> {
	const embedding = (await getEmbedding(value)) ?? (await setEmbedding(value))
	await db.embedding.updateMany({
		where: { hash: embedding.hash, AND: { NOT: { type: { has: type } } } },
		data: { type: { push: type } },
	})
	return embedding
}

export async function embed(value: string, type: "Query"): Promise<Embedding>
export async function embed(
	value: string,
	type?: Exclude<EmbeddingType, "Query">
): Promise<Embedding[]>
export async function embed(
	value: string,
	type: EmbeddingType = "Content"
): Promise<Embedding | Embedding[]> {
	if (type === "Query") return embedOne([{ type: "text", text: value }], type)
	const chunks = await chunker.chunk(value)
	return Promise.all(chunks.map((chunk) => embedOne([{ type: "text", text: chunk.text }], type)))
}
export async function embedDocument(
	title: string,
	values: string[],
	type: EmbeddingType & "Content" = "Content"
): Promise<Embedding[]> {
	const chunks = (await Promise.all(values.map((value) => chunker.chunk(value)))).flat()
	return Promise.all(
		chunks.map((chunk) => {
			const template = `title: ${title} | text: ${chunk.text}`
			return embedOne([{ type: "text", text: chunk.text }], type)
		})
	)
}
export async function embedImage(
	title: string,
	values: [DocumentTextPeice, DocumentImagePeice],
	type: EmbeddingType & "Content" = "Content"
): Promise<Embedding> {
	const template = `title: ${title} | text: ${values[0].text}`
	return embedOne(
		[
			{ type: "text", text: template },
			{ type: "image", image: values[1].image },
		],
		type
	)
}

type SupportedModels = "gemini-embedding-2" | "qwen3-embedding"
type GeminiTasks =
	| "search result"
	| "question answering"
	| "fact checking"
	| "code retrieval"
	| "classification"
	| "clustering"
	| "sentence similarity"
function buildInstructionTemplate(
	task_description: GeminiTasks,
	query: string,
	model: "gemini-embedding-2"
): string
function buildInstructionTemplate(
	task_description: string,
	query: string,
	model: Exclude<SupportedModels, "gemini-embedding-2">
): string
function buildInstructionTemplate(
	task_description: string,
	query: string,
	model: SupportedModels
): string {
	let out: string | undefined
	if (model === "gemini-embedding-2") out = `task: ${task_description} | query: ${query}`
	else if (model === "qwen3-embedding")
		out = `Instruct: ${task_description}
Query:${query}`
	if (out === undefined) throw Error("Invalid input somehow.")
	return out
}

async function findSimilarByHash(hash: Uint8Array): Promise<Uint8Array[]> {
	const rows = await db.$queryRaw<{ hash: Buffer }[]>`
		SELECT hash
		FROM "Embedding"
		WHERE type @> ARRAY['Content']::"EmbeddingType"[]
		ORDER BY embedding <=> (SELECT embedding FROM "Embedding" WHERE hash = ${Buffer.from(hash)} LIMIT 1)
		LIMIT 500
	`
	return rows.map(
		(row) => new Uint8Array(row.hash.buffer, row.hash.byteOffset, row.hash.byteLength)
	)
}

export async function search(query: string) {
	const embedding = await embed(
		buildInstructionTemplate(
			"search result", //"Given a web search query, retrieve relevant passages that answer the query",
			query,
			"gemini-embedding-2"
		),
		"Query"
	)
	const similar = await findSimilarByHash(embedding.hash)
	const rankByHash = new Map(similar.map((hash, i) => [Buffer.from(hash).toString("hex"), i]))
	const embeddingsAndContent = await db.embedding.findMany({
		where: {
			hash: { in: similar.map((value) => Uint8Array.from(value)) },
		},
		include: {
			content: {
				select: {
					id: true,
				},
			},
		},
	})
	embeddingsAndContent.sort(
		(a, b) =>
			(rankByHash.get(Buffer.from(a.hash).toString("hex")) ?? Infinity) -
			(rankByHash.get(Buffer.from(b.hash).toString("hex")) ?? Infinity)
	)
	const seen = new Set<string>()
	return embeddingsAndContent
		.flatMap((e) => e.content.map((c) => c.id))
		.filter((id) => !seen.has(id) && seen.add(id))
		.map((id) => {
			return { id }
		})
}

/**
 * The OpenRouter interface instance with the `embeddings` property omitted.
 */
export const openrouter: Omit<OpenRouter, "embeddings"> = openrouterInternal
