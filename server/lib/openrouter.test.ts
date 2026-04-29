import fs from "node:fs/promises"
import path from "node:path"
import { describe, expect, test } from "vitest"
import { embed, embedImage } from "./openrouter.ts"

describe("openrouter embeddings", () => {
	test("embeds plain text", { timeout: 30000 }, async () => {
		const result = await embed("a simple text embedding test", "Query")

		expect(result.embedding).toBeInstanceOf(Float32Array)
		expect(result.embedding.length).toBeGreaterThan(0)
		expect(result.hash).toBeInstanceOf(Uint8Array)
	})

	test("embeds text + image multimodally", { timeout: 30000 }, async () => {
		const buf = await fs.readFile(path.resolve("prisma/seed-data/content/sample-image.jpg"))
		const image = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)

		const result = await embedImage("test title", [
			{ type: "text", text: "a sample image for embedding" },
			{ type: "image", image },
		])

		expect(result.embedding).toBeInstanceOf(Float32Array)
		expect(result.embedding.length).toBeGreaterThan(0)
		expect(result.hash).toBeInstanceOf(Uint8Array)
	})
})
