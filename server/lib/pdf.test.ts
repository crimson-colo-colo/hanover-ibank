import fs from "node:fs/promises"
import path from "node:path"
import { describe, expect, test } from "vitest"
import { pdfText } from "./pdf-extractor.ts"

describe("pdf", () => {
	test("extracts text properly", { timeout: 60000 }, async () => {
		const buffer = await fs.readFile(path.resolve("prisma/seed-data/content/sample-pdf.pdf"))
		const result = await pdfText(
			buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
		)
		expect(result).toContain("This is a sample PDF.")
	})

	test("can handle concurrency", { timeout: 60000 }, async () => {
		const buffer = await fs.readFile(path.resolve("prisma/seed-data/content/sample-pdf.pdf"))
		const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
		const results = await Promise.all(Array.from({ length: 16 }, () => pdfText(ab.slice(0))))
		for (const result of results) {
			expect(result).toContain("This is a sample PDF.")
		}
	})
})
