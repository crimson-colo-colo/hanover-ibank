import { FileType } from "@shared/filetype.ts"
import { db } from "../database.ts"
import { embed } from "../lib/openrouter.ts"
import { pdfText } from "../lib/pdf-extractor.ts"
import { bucketName, s3 } from "../s3.ts"
import { convertToPDF } from "./preview.ts"

type NotNull<Type> = Exclude<Type, undefined | null>

export async function embedPDF(
	content: Pick<
		Awaited<ReturnType<typeof db.content.findFirstOrThrow<{ include: { tags: true } }>>>,
		| "id"
		| "lastModifiedDate"
		| "title"
		| "status"
		| "objectId"
		| "expirationDate"
		| "tags"
		| "type"
		| "url"
	>
) {
	let text: string | undefined
	if (content.type === "Object") {
		let object: any | undefined
		if (content.objectId !== null) {
			object = await s3.getObject({
				Bucket: bucketName satisfies NotNull<typeof bucketName>,
				Key: content.objectId satisfies NotNull<typeof content.objectId>,
			})
		}
		const buffer = await object?.Body?.transformToByteArray()
		const s3ObjectId = content.objectId
		const fileTypeUnfiltered = object?.Metadata?.filetype
		const fileType: FileType =
			fileTypeUnfiltered !== undefined
				? Object.values(FileType)
						.map((value) => value.toString())
						.includes(fileTypeUnfiltered)
					? (fileTypeUnfiltered as FileType)
					: "unknown"
				: "unknown"
		if (fileType === undefined || s3ObjectId === null || buffer === undefined) return
		let pdfBuffer: ArrayBuffer | undefined
		if (fileType === "pdf") {
			const buf = Buffer.from(buffer)
			pdfBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
		} else if (
			(fileType === "docx" || fileType === "pptx" || fileType === "xlsx") &&
			typeof s3ObjectId === "string"
		) {
			const request = await convertToPDF(s3ObjectId, `file.${fileType}`)
			const pdf = request.ok && (await request.blob())
			if (pdf !== false) pdfBuffer = await pdf.arrayBuffer()
		}
		if (fileType === "plaintext") text = Buffer.from(buffer).toString("utf-8")
		if (pdfBuffer !== undefined) {
			text = await pdfText(pdfBuffer)
		}
	} else if (content.type === "Link") {
		if (content.url !== null) text = content.url
	}
	if (text !== undefined && text.length > 50000) {
		return `${text.match(/^.{25000}/)}...${text.match(/.{25000}$/)}`
	}
	const formattedText = `title: ${content.title.substring(0, 3000)}
status: ${content.status}
expiration date: ${content.expirationDate.toDateString()}
tags: ${content.tags
		.map((v) => `${v.tagCategory} - ${v.tagName.substring(0, 500)}`)
		.join(", ")
		.substring(0, 5000)}
---
${text}`
	const embedding = await embed(formattedText)
	await db.content.update({
		where: { id: content.id },
		data: {
			embeddings: { set: [{ hash: embedding.hash }] },
		},
	})
}
