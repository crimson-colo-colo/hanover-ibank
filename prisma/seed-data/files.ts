import fs from "node:fs/promises"
import path from "node:path"
import type { FileType } from "@shared/filetype.ts"
import { unzipSync } from "fflate"
import { v4 as uuidv4 } from "uuid"
import type { Prisma } from "../../server/generated/prisma/client.ts"
import { ContentStatus, ContentType } from "../../server/generated/prisma/enums.ts"
import { getFileTypeFromFile } from "../../server/lib/filetype.ts"
import { bucketName, s3 } from "../../server/s3.ts"
import { randomUserId } from "./users.ts"

const baseDir = "./prisma/seed-data"
const contentDir = path.join(baseDir, "content")
const generatedDir = path.join(baseDir, "generated")
const allFiles = await fs
	.readdir(contentDir)
	.then((files) => files.map((f) => path.join("content", f)))
if (await fs.stat(generatedDir).catch(() => false)) {
	const genFiles = await fs.readdir(generatedDir)
	allFiles.push(...genFiles.map((f) => path.join("generated", f)))
}

const fileNameToObjectId = new Map<string, string>()
export const objectIdToFileType = new Map<string, FileType>()

export async function uploadFilesToS3() {
	const hanoverData = unzipSync(
		await fs.readFile("prisma/seed-data/Hanover Data.zip").catch((err) => {
			console.error("Error reading zip file:", err)
			console.error(
				"Make sure the file 'Hanover Data.zip' exists in the 'prisma/seed-data' directory. Download this file from Canvas if you don't have it."
			)
			process.exit(1)
		})
	)

	await Promise.all([
		...allFiles.map(async (file) => {
			const id = uuidv4()
			const filePath = path.join(baseDir, file)
			const f = await fs.readFile(filePath)
			console.log(`Uploading file ${file} (${id}) to S3...`)
			const buffer = Buffer.from(f)
			const fileType = await getFileTypeFromFile(file, buffer)
			await s3.putObject({
				Bucket: bucketName,
				Key: id,
				Body: buffer,
				Metadata: {
					filetype: fileType,
				},
			})
			fileNameToObjectId.set(path.basename(file), id)
			objectIdToFileType.set(id, fileType)
		}),
		...Object.entries(hanoverData).map(async ([filename, content]) => {
			if (filename.endsWith("/")) return // skip directories
			const id = uuidv4()
			console.log(`Uploading file ${filename} (${id}) to S3...`)
			const buffer = Buffer.from(content)
			const fileType = await getFileTypeFromFile(filename, buffer)
			await s3.putObject({
				Bucket: bucketName,
				Key: id,
				Body: buffer,
				Metadata: {
					filetype: fileType,
				},
			})
			fileNameToObjectId.set(path.basename(filename), id)
			objectIdToFileType.set(id, fileType)
		}),
	])
}

export function fileContentData() {
	return [...fileNameToObjectId.entries()].map(([filename, id]) => {
		const daysEditedAgo = Math.floor(Math.random() * 365)
		const lastModifiedDate = new Date()
		lastModifiedDate.setDate(lastModifiedDate.getDate() - daysEditedAgo)
		const expiresInDays = -100 + Math.floor(Math.random() * 200)
		const expirationDate = new Date()
		expirationDate.setDate(expirationDate.getDate() + expiresInDays)
		const status =
			Math.random() < 0.33
				? ContentStatus.Complete
				: Math.random() < 0.5
					? ContentStatus.Incomplete
					: ContentStatus.UnderReview
		return {
			title: filename,
			ownerId: randomUserId(),
			lastModifiedDate,
			expirationDate,
			objectId: id,
			type: ContentType.Object,
			status: status,
			createdAt: lastModifiedDate,
		} satisfies Prisma.ContentCreateManyInput
	})
}
