import fs from "node:fs/promises"
import path from "node:path"
import { describe, expect, test } from "vitest"
import { embed } from "./openrouter.ts"

describe("openrouter embeddings", () => {
	test("embeds plain text", { timeout: 30000 }, async () => {
		const result = await embed("a simple text embedding test", "Query")

		expect(result.embedding).toBeInstanceOf(Float32Array)
		expect(result.embedding.length).toBeGreaterThan(0)
		expect(result.hash).toBeInstanceOf(Uint8Array)
	})
})
