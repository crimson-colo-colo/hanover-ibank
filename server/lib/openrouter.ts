import { RecursiveChunker } from "@chonkiejs/core"
import { OpenRouter } from "@openrouter/sdk"
import { db } from "../database.ts"
import { env } from "../env.ts"
import type { EmbeddingType } from "../generated/prisma/enums.ts"
import { type DocumentTextPiece, type Embedding, embedOne } from "./embeddings.ts"

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
	chunkSize: env.CHUNK_LENGTH,
	minCharactersPerChunk: 24,
})

export async function embed(value: string, type: "Query"): Promise<Embedding>
export async function embed(value: string[], type?: EmbeddingType): Promise<Embedding[]>
/**
 * Embed content.
 * @param value the unchunked text to be embedded
 * @param type If the text is content or a query.
 */
export async function embed(
	value: string | string[],
	type: EmbeddingType = "Content"
): Promise<Embedding | Embedding[]> {
	if (typeof value === "string") return embedOne(value, type)
	return await Promise.all(value.map((value) => embedOne(value, type)))
}
/**
 * Embed a document.
 * @param title
 * @param values a pair of text and image, where the text metadata precedes the text.
 * @param type
 */
export async function embedDocument({
	metadata,
	content,
}: {
	metadata: string
	content: string
}): Promise<Embedding[]> {
	const strings = await buildTemplate({
		type: "document",
		metadata: metadata,
		content: content,
	})
	return await embed(strings, "Content")
}

export const DEFAULT_MODEL_TEMPLATE = "qwen3-embedding" satisfies SupportedModels

type SupportedModels = "qwen3-embedding"
type BuildTemplateParamDocument = {
	type: "document"
	metadata: string
	content: string
}
type BuildTemplateParamQuery = { type: "query"; instruction?: string; search: string }
type BuildTemplateParameters = BuildTemplateParamDocument | BuildTemplateParamQuery
export async function buildTemplate(input: BuildTemplateParamQuery): Promise<[string]>
export async function buildTemplate(input: BuildTemplateParamDocument): Promise<string[]>
export async function buildTemplate(input: BuildTemplateParameters): Promise<string[]> {
	if (input.type === "document") {
		const chunks = await chunker.chunk(input.content)
		return chunks.map(
			(v) =>
				`${input.metadata}\n---\n${v.startIndex > 10 ? "..." : ""} + ${v.text} + ${v.endIndex < input.content.length - 10 ? "..." : ""}`
		)
	} else {
		return [
			`Instruct: ${input.instruction}
Query:${input.search}`,
		]
	}
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
		(
			await buildTemplate({
				type: "query",
				search: query,
			})
		)[0],
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
