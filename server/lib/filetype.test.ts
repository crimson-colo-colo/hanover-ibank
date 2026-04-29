import fs from "node:fs/promises"
import { basename } from "node:path"
import { FileType } from "@shared/filetype.ts"
import { describe, expect, it } from "vitest"
import { getFileTypeFromFile } from "./filetype.ts"

describe("filetype", () => {
	it("should correctly identify file types", async () => {
		const files = {
			"prisma/seed-data/content/sample-excel.xlsx": FileType.Excel,
			"prisma/seed-data/content/sample-image.jpg": FileType.Image,
			"prisma/seed-data/content/sample-pdf.pdf": FileType.Pdf,
			"prisma/seed-data/content/sample-word.docx": FileType.WordDocument,
			"prisma/seed-data/content/sample-powerpoint.pptx": FileType.Powerpoint,
			"README.md": FileType.Plaintext,
		}

		for (const [path, expectedType] of Object.entries(files)) {
			const buffer = await fs.readFile(path)
			const fileType = await getFileTypeFromFile(path, buffer)
			expect(fileType, `File type for ${basename(path)}`).toBe(expectedType)
		}
	})
})
