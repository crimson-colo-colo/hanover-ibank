import { FileType } from "@shared/filetype.ts"
import ogs from "open-graph-scraper"
import { db } from "../database.ts"
import { convertToPDF } from "../routers/preview.ts"
import { bucketName, s3 } from "../s3.ts"
import type { Embedding } from "./embeddings.ts"
import { embedDocument, embedImage } from "./openrouter.ts"
import { pdfText } from "./pdf-extractor.ts"

type NotNull<Type> = Exclude<Type, undefined | null>

export async function embedFile(
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
	let image: Uint8Array<ArrayBufferLike> | undefined
	if (content.type === "Object") {
		let object: Parameters<Parameters<(typeof s3)["getObject"]>[2]>[1] | undefined // probably a better way
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
		if (s3ObjectId === null || buffer === undefined) return
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
		if (fileType === "image") image = buffer
	} else if (content.type === "Link") {
		if (content.url !== null) {
			const parts = [content.url]
			const { error, result } = await ogs({ url: content.url })
			if (!error) {
				if (result.ogTitle) parts.push(result.ogTitle)
				if (result.ogDescription) parts.push(result.ogDescription)
			}
			text = parts.join("\n")
		}
	}
	if (text !== undefined && text.length > 50000) {
		return `${text.match(/^.{25000}/)}...${text.match(/.{25000}$/)}`
	}
	const formattedText = `# ${content.title.substring(0, 3000)}
status: ${content.status}
expiration date: ${content.expirationDate.toDateString()}
tags: ${content.tags
		.map((v) => `${v.tagCategory} - ${v.tagName.substring(0, 500)}`)
		.join(", ")
		.substring(0, 5000)}`
	let embeddings: Embedding[] = []
	if (image !== undefined) {
		embeddings = [
			...embeddings,
			await embedImage(content.title.substring(0, 3000), [
				{ type: "text", text: formattedText },
				{ type: "image", image: image },
			]),
		]
	} else {
		console.log("Embeddings generated from text:")
		console.group()
		console.log(formattedText)
		console.log(text)
		console.groupEnd()
		embeddings = [
			...embeddings,
			...(await embedDocument(content.title.substring(0, 3000), [
				formattedText,
				...(text ? [text] : []),
			])),
		]
	}
	await db.content.update({
		where: { id: content.id },
		data: {
			embeddings: { set: embeddings?.map((embedding) => ({ hash: embedding.hash })) },
		},
	})
}
