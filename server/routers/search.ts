import z from "zod"
import { db } from "../database.ts"
import { fetchAndTransformToContentListItems, getContentInclude } from "../lib/content.ts"
import { buildTemplate, DEFAULT_MODEL_TEMPLATE, embed, embedDocument } from "../lib/openrouter.ts"
import { authProcedure, router } from "../trpc.ts"

export const searchRouter = router({
	getIndex: authProcedure.query(async (opts) => {
		const content = await db.content.findMany({
			include: getContentInclude(opts.ctx.auth.sub),
		})

		const embeddings = await db.$queryRaw<{ contentId: string; embedding: string }[]>`
			SELECT "Content"."id" as "contentId", "Embedding"."embedding"::text
			FROM "Embedding"
					 JOIN "_ContentToEmbedding" ON "Embedding"."hash" = "_ContentToEmbedding"."B"
				     JOIN "Content" ON "Content"."id" = "_ContentToEmbedding"."A"
		`

		const embeddingMap = new Map<string, { count: number; totals: number[] }>()
		for (const { contentId, embedding } of embeddings) {
			if (!embeddingMap.has(contentId)) {
				embeddingMap.set(contentId, { count: 0, totals: [] })
			}
			const parsed = (JSON.parse(embedding) as number[]).slice(0, 768)
			const entry = embeddingMap.get(contentId)!
			entry.count++
			if (entry.totals.length === 0) {
				entry.totals = parsed
			} else {
				for (let i = 0; i < parsed.length; i++) {
					entry.totals[i] += parsed[i]
				}
			}
		}

		return (await fetchAndTransformToContentListItems(content, opts.ctx.auth.sub)).map((item) => {
			const embedding = embeddingMap
				.get(item.id)
				?.totals.map((total) => total / embeddingMap.get(item.id)!.count)
			const encoded = embedding
				? new Uint8Array(new Float16Array(embedding).buffer).toBase64()
				: undefined
			return {
				...item,
				embedding: encoded,
			}
		})
	}),

	embedQuery: authProcedure.input(z.object({ query: z.string() })).query(async (opts) => {
		const embedding = await embed(
			(
				await buildTemplate({
					type: "query",
					search: opts.input.query,
					instruction: "Given a web search query, retrieve relevant passages that answer the query",
				})
			)[0],
			"Query"
		)
		return new Uint8Array(
			new Float16Array(normalizeVector(embedding.embedding.slice(0, 768))).buffer
		).toBase64()
	}),

	embedFilter: authProcedure.input(z.object({ filter: z.string() })).query(async (opts) => {
		const embedding = await embedDocument({ metadata: "Tag", content: opts.input.filter })
		return new Uint8Array(
			new Float16Array(normalizeVector(embedding[0].embedding.slice(0, 768))).buffer
		).toBase64()
	}),
})

function normalizeVector(vector: Float32Array | number[]): number[] {
	if (vector instanceof Float32Array) {
		vector = Array.from(vector.values())
	}
	const length = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
	return vector.map((val) => val / length)
}
