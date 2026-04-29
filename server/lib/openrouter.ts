import { RecursiveChunker } from "@chonkiejs/core"
import { OpenRouter } from "@openrouter/sdk"
import { db } from "../database.ts"
import { env } from "../env.ts"
import type { EmbeddingType } from "../generated/prisma/enums.ts"
import {
	type DocumentImagePiece,
	type DocumentTextPiece,
	type Embedding,
	embedOne,
} from "./embeddings.ts"

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

/**
 * where to make openrouter calls
 */
export const openrouter: Omit<OpenRouter, "embeddings"> = new OpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
})

const chunker = await RecursiveChunker.create({
	tokenizer: "character",
	chunkSize: 6000,
	minCharactersPerChunk: 24,
})

export async function embed(value: string, type: "Query"): Promise<Embedding>
export async function embed(
	value: string,
	type?: Exclude<EmbeddingType, "Query">
): Promise<Embedding[]>
/**
 * Embed content.
 * @param value the text to be embedded
 * @param type If the text is content or a query.
 */
export async function embed(
	value: string,
	type: EmbeddingType = "Content"
): Promise<Embedding | Embedding[]> {
	if (type === "Query") return embedOne([{ type: "text", text: value }], type)
	const chunks = await chunker.chunk(value)
	return Promise.all(chunks.map((chunk) => embedOne([{ type: "text", text: chunk.text }], type)))
}
/**
 * Embed a document.
 * @param title
 * @param values a pair of text and image, where the text metadata precedes the text.
 * @param type
 */
export async function embedDocument(
	title: string,
	values: string[],
	type: EmbeddingType & "Content" = "Content"
): Promise<Embedding[]> {
	const chunks = (await Promise.all(values.map((value) => chunker.chunk(value)))).flat()
	return Promise.all(
		chunks.map((chunk) => {
			const template = `title: ${title} | text: ${chunk.text}`
			return embedOne([{ type: "text", text: template }], type)
		})
	)
}

/**
 * Embed an image document with its metadata.
 * @param title
 * @param values a pair of text and image, where the text metadata precedes the text.
 * @param type
 */
export async function embedImage(
	title: string,
	values: [DocumentTextPiece, DocumentImagePiece],
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
/**
 * Create an query instruction template for creating a query embedding.
 * @param task_description
 * @param query
 * @param model
 */
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

/**
 * The search function. This should be used when you want to get a list of content
 * ids that are close to what you want.
 * @param query
 */
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
