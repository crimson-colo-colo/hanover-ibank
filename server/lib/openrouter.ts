import { OpenRouter } from "@openrouter/sdk"
import hash from "object-hash"
import { db } from "../database.ts"
import { env } from "../env.ts"
import type { EmbeddingType } from "../generated/prisma/enums.ts"

const openrouterInternal = new OpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
})
type Embedding = { hash: Uint8Array<ArrayBuffer>; embedding: Float32Array }

export async function getEmbedding(value: string): Promise<Embedding | null> {
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

async function setEmbedding(value: string): Promise<Embedding> {
	const sourceHash: Uint8Array = hash(value, { algorithm: "md5", encoding: "buffer" })
	const response = await openrouterInternal.embeddings.generate({
		requestBody: {
			user: "server",
			encodingFormat: "float",
			model: "qwen/qwen3-embedding-8b",
			dimensions: 1024,
			input: [{ content: [{ type: "text", text: value }] }],
		},
	})
	if (typeof response === "string") throw Error("Improper embedding response.")
	const embedding = response.data[0].embedding
	if (typeof embedding === "string") throw Error("Improper embedding response.")
	await db.$executeRaw`
        INSERT INTO "Embedding" (hash, embedding)
        VALUES (${sourceHash}, ${`[${embedding.join(",")}]`}::vector)
        ON CONFLICT (hash) DO UPDATE SET embedding = EXCLUDED.embedding
    `
	return {
		hash: Uint8Array.from(sourceHash),
		embedding: Float32Array.from(embedding),
	}
}

export async function embed(value: string, type: EmbeddingType = "Content"): Promise<Embedding> {
	const embedding = (await getEmbedding(value)) ?? (await setEmbedding(value))
	await db.embedding.update({
		where: { hash: embedding.hash, AND: { NOT: { type: { has: type } } } },
		data: { type: { push: type } },
	})
	return embedding
}

function buildInstructionTemplate(task_description: string, query: string): string {
	return `Instruct: ${task_description}
Query:${query}`
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
			"Given a web search query, retrieve relevant passages that answer the query",
			query
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

// making the above function the only place where poeple can use the embedding endpoint by
// omitting the openrouter endpoint
/**
 * The OpenRouter interface instance with the `embeddings` property omitted.
 */
export const openrouter: Omit<OpenRouter, "embeddings"> = openrouterInternal
