import fs from "node:fs/promises"
import path from "node:path"
import { createEnv } from "@t3-oss/env-core"
import objectHash from "object-hash"
import { type GenerateResponse, Ollama, type Options } from "ollama"
import z from "zod"

const env = createEnv({
	server: {
		OLLAMA_HOST: z.url(),
		OLLAMA_CLIENT_ID: z.string(),
		OLLAMA_CLIENT_SECRET: z.string(),
	},
	runtimeEnv: process.env,
})

const ollama = new Ollama({
	host: env.OLLAMA_HOST,
	headers: {
		"CF-Access-Client-Id": env.OLLAMA_CLIENT_ID,
		"CF-Access-Client-Secret": env.OLLAMA_CLIENT_SECRET,
	},
})

const CACHE_FILE = ".cache/ollama/responses.json"
await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })

const cache = new Map<string, GenerateResponse>()
try {
	const cachedData = await fs.readFile(CACHE_FILE, "utf-8")
	const parsedData = JSON.parse(cachedData)
	for (const [key, value] of Object.entries(parsedData)) {
		cache.set(key, value as GenerateResponse)
	}
} catch {}

async function saveCache() {
	const obj: Record<string, GenerateResponse> = {}
	for (const [key, value] of cache.entries()) {
		obj[key] = value
	}
	await fs.writeFile(CACHE_FILE, JSON.stringify(obj, null, 2), "utf-8")
}

type GenerateParams = {
	prompt: string
	options?: Partial<Options>
	model?: string
	schema?: z.ZodType
}

function getCacheKey(params: GenerateParams): string {
	return objectHash(params)
}

console.log(`[ollama] initialized client for host ${env.OLLAMA_HOST}`)

export const seed = 2
async function ollamaGenerate(params: GenerateParams): Promise<GenerateResponse> {
	console.log(`[ollama] generate ${params.model} seed=${seed}: ${params.prompt}`)
	return await ollama.generate({
		model: params.model!,
		prompt: params.prompt,
		stream: false,
		think: true,
		format: params.schema,
		options: params.options,
	})
}

export async function generate(params: {
	prompt: string
	options?: Partial<Options>
	model?: string
	schema?: z.ZodType
}): Promise<GenerateResponse> {
	const mergedParams: GenerateParams = {
		model: "gemma4:26b",
		...params,
		options: {
			num_ctx: 16384,
			...(params.options ?? {}),
			seed: seed + (params.options?.seed ?? 0),
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
