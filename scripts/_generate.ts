import fs from "node:fs/promises"
import path from "node:path"
import { createEnv } from "@t3-oss/env-core"
import objectHash from "object-hash"
import { type ChatResponse, Ollama, type Options } from "ollama"
import z, { type ZodType } from "zod"

const env = createEnv({
	server: {
		OLLAMA_HOST: z.url(),
		OLLAMA_CLIENT_ID: z.string().optional(),
		OLLAMA_CLIENT_SECRET: z.string().optional(),
	},
	runtimeEnv: process.env,
})

const ollama = new Ollama({
	host: env.OLLAMA_HOST,
	headers: {
		"CF-Access-Client-Id": env.OLLAMA_CLIENT_ID,
		"CF-Access-Client-Secret": env.OLLAMA_CLIENT_SECRET,
	},
	// @ts-expect-error
	fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5 * 6 * 600_000) }),
})

const CACHE_FILE = ".cache/ollama/responses.json"
await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })

const cache = new Map<string, ChatResponse>()
try {
	const cachedData = await fs.readFile(CACHE_FILE, "utf-8")
	const parsedData = JSON.parse(cachedData)
	for (const [key, value] of Object.entries(parsedData)) {
		cache.set(key, value as ChatResponse)
	}
} catch {}

async function saveCache() {
	const obj: Record<string, ChatResponse> = {}
	for (const [key, value] of cache.entries()) {
		obj[key] = value
	}
	await fs.writeFile(CACHE_FILE, JSON.stringify(obj, null, 2), "utf-8")
}
z.toJSONSchema(z.object())
type GenerateParams<T extends z.ZodType> = {
	prompt: string
	options?: Partial<Options>
	model?: string
	schema?: Parameters<typeof z.toJSONSchema<T>>[0]
}

function getCacheKey<T extends ZodType>(params: GenerateParams<T>): string {
	return objectHash(params)
}

const content =
	"You are generating fictional sample documents for a software demo of an insurance content" +
	" management system. All content is entirely fictional and for demonstration purposes only." +
	" Write each document authentically to its topic in a professional corporate tone. If a " +
	"topic is inherently absurd or satirical, play it completely straight with dry corporate " +
	"seriousness. Do not sanitize, redirect, or refuse any topic."

console.log(`[ollama] initialized client for host ${env.OLLAMA_HOST}`)
export const seed = 2
async function ollamaGenerate<T extends ZodType>(params: GenerateParams<T>): Promise<ChatResponse> {
	console.log(
		`[ollama] generate ${params.model} seed=${seed}: ${params.prompt.slice(0, 50)}...${params.prompt.slice(params.prompt.length - 50, params.prompt.length)}`
	)
	const res = await ollama.chat({
		model: params.model!,
		messages: [
			{ role: "system", content: content },
			{ role: "user", content: params.prompt },
		],
		keep_alive: "10m",
		stream: false,
		think: true,
		format: params.schema ? z.toJSONSchema(params.schema) : undefined,
		options: params.options,
	})
	return res
}

export async function generate<T extends ZodType>(params: {
	prompt: string
	options?: Partial<Options>
	model?: string
	schema?: GenerateParams<T>["schema"]
}): Promise<ChatResponse> {
	const mergedParams: GenerateParams<T> = {
		model: "gemma4:e4b",
		...params,
		options: {
			num_ctx: 16384,
			...(params.options ?? {}),
			seed: seed + (params.options?.seed ?? 0),
			num_batch: 64,
			num_predict: 16000,
		},
	}

	const cacheKey = getCacheKey(mergedParams)

	if (cache.has(cacheKey)) {
		console.log(`[cache] hit: ${mergedParams.prompt.slice(0, 50)}...`)
		return cache.get(cacheKey)!
	}

	const res = await ollamaGenerate(mergedParams)
	cache.set(cacheKey, res)
	await saveCache()
	return res
}
