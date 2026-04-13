import { existsSync } from "node:fs"
import fs, { readFile } from "node:fs/promises"
import path from "node:path"
import { useOrientation } from "@mantine/hooks"
import { PrismaPg } from "@prisma/adapter-pg"
import type { FileType } from "@shared/filetype.ts"
import { unzipSync } from "fflate"
import { v4 as uuidv4 } from "uuid"
import { auth0Management } from "../server/auth.ts"
import type { ContentTag } from "../server/generated/prisma/browser.ts"
import {
	ContentStatus,
	ContentType,
	DocumentType,
	EmployeeRole,
	type Prisma,
	PrismaClient,
} from "../server/generated/prisma/client.ts"
import { generateDefaultAvatar } from "../server/lib/avatar.ts"
import { getFileTypeFromFile } from "../server/lib/filetype.ts"
import { bucketName, s3 } from "../server/s3.ts"
import * as Data from "./seed/data.ts"
import { employeeData } from "./seed/data.ts"

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

main(prisma)
	.catch((e) => {
		console.error("❌ Error seeding database:", e)
		process.exit(1)
	})
	.finally(async () => {
		console.log("✅ Finished seeding database")
		await prisma.$disconnect()
	})

async function main(prisma: PrismaClient) {
	/// CONNECT TO PRISMA
	await prisma.$connect()

	/// CHECK FOR EXISTING DATA AND PROMPT FOR DELETION
	const [employees, tempContent] = await Promise.all([
		prisma.employee.count(),
		prisma.content.count(),
	])
	if (employees > 0 || tempContent > 0) {
		process.stdout.write(
			`⚠️ \x1b[33mDatabase already has data (employee: ${employees}, content: ${tempContent}. Continuing will erase existing data and cannot be undone. Really continue? [y/N] \x1b[0m`
		)
		const answer = await new Promise<string>((resolve) => {
			process.stdin.setEncoding("utf-8")
			process.stdin.once("data", (data) =>
				resolve(
					(typeof data === "string" ? data : new TextDecoder().decode(data)).trim().toLowerCase()
				)
			)
		})
		if (answer !== "y" && answer !== "yes") {
			console.log("Aborting.")
			return
		}
	}

	/// USER AGREED TO DELETION, BEGIN SEEDING
	console.log("🌱 Seeding database...")

	/// delete old data
	await prisma.$transaction([
		prisma.content.deleteMany(),
		prisma.employee.deleteMany(),
		prisma.contentTag.deleteMany(),
	])

	/// delete all s3 files and content
	const objects = await s3.listObjectsV2({ Bucket: bucketName, MaxKeys: 1000 })
	if (objects.Contents && objects.Contents.length > 0) {
		await s3.deleteObjects({
			Bucket: bucketName,
			Delete: { Objects: objects.Contents.map((obj) => ({ Key: obj.Key! })) },
		})
	}

	/// get hardwritten list of users and add them to the database
	const { employeeData } = Data

	await prisma.$transaction(
		employeeData.map((employee) =>
			prisma.employee.create({
				data: {
					...employee,
				},
				select: { id: true },
			})
		)
	)

	for (const employee of employeeData) {
		const user = await auth0Management.users.get(employee.id)
		const avatar = generateDefaultAvatar(user.name ?? user.email!)

		console.log(`Uploading default avatar for user ${user.name ?? "(unknown)"} to S3...`)

		await s3.putObject({
			Bucket: bucketName,
			Key: `avatar/${employee.id}.png`,
			Body: avatar,
		})
	}

	const analysts = employeeData.filter((employee) => employee.role === EmployeeRole.BusinessAnalyst)
	const underwriters = employeeData.filter((employee) => employee.role === EmployeeRole.Underwriter)
	let analystIndex = 0
	let undewriterIndex = 0

	function nextAnalyst() {
		const a = analysts[analystIndex]
		analystIndex = (analystIndex + 1) % analysts.length
		return a.id
	}

	function nextUndewriter() {
		const u = underwriters[undewriterIndex]
		undewriterIndex = (undewriterIndex + 1) % underwriters.length
		return u.id
	}

	console.log(`Created ${employeeData.length} employee rows`)

	// ===== Content Tags =====
	const { tags } = Data
	const contentTags = await prisma.contentTag.createManyAndReturn({
		data: tags,
	})

	const { underwriterContent, businessAnalystContent } = Data

	const contentData = [
		...underwriterContent.map((content) => ({
			...content,
			ownerId: nextUndewriter(),
			intendedAudience: [EmployeeRole.Underwriter],
		})),
		...businessAnalystContent.map((content) => ({
			...content,
			ownerId: nextAnalyst(),
			intendedAudience: [EmployeeRole.BusinessAnalyst],
		})),
	] satisfies Prisma.ContentCreateManyInput[]

	const urlContent = await prisma.content.createManyAndReturn({
		data: contentData,
		select: { id: true },
	})
	console.log(`Created ${contentData.length} content rows`)

	const baseDir = "./prisma/seed-data"
	const generatedDir = path.join(baseDir, "generated")
	const allFiles = (await fs.readdir(baseDir)).filter(
		(f) => f !== "Hanover Data.zip" && f !== "generated"
	)
	if (existsSync(generatedDir)) {
		const genFiles = await fs.readdir(generatedDir)
		allFiles.push(...genFiles.map((f) => path.join("generated", f)))
	}

	const ids = new Map<string, string>()
	const idToFileType = new Map<string, FileType>()
	for (const file of allFiles) {
		const id = uuidv4()
		const filePath = path.join(baseDir, file)
		const f = await readFile(filePath)
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
		ids.set(path.basename(file), id)
		idToFileType.set(id, fileType)
	}

	const hanoverData = unzipSync(
		await fs.readFile("prisma/seed-data/Hanover Data.zip").catch((err) => {
			console.error("Error reading zip file:", err)
			console.error(
				"Make sure the file 'Hanover Data.zip' exists in the 'prisma/seed-data' directory. Download this file from Canvas if you don't have it."
			)
			process.exit(1)
		})
	)

	for (const [filename, content] of Object.entries(hanoverData)) {
		if (filename.endsWith("/")) continue // skip directories
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
		ids.set(path.basename(filename), id)
	}

	const fileContent = [...ids.entries()].map(([filename, id]) => {
		const daysEditedAgo = Math.floor(Math.random() * 365)
		const lastModifiedDate = new Date()
		lastModifiedDate.setDate(lastModifiedDate.getDate() - daysEditedAgo)
		const expiresInDays = 30 + Math.floor(Math.random() * 365)
		const expirationDate = new Date()
		expirationDate.setDate(expirationDate.getDate() + expiresInDays)
		const isUnderwriter = Math.random() < 0.5
		return {
			title: filename,
			type: ContentType.Object,
			ownerId: isUnderwriter ? nextUndewriter() : nextAnalyst(),
			lastModifiedDate,
			expirationDate,
			documentType: Math.random() < 0.5 ? DocumentType.Reference : DocumentType.Workflow,
			objectId: id,
			intendedAudience: [isUnderwriter ? EmployeeRole.Underwriter : EmployeeRole.BusinessAnalyst],
		} satisfies Prisma.ContentCreateManyInput
	})

	const contentByFileType = new Map<FileType, string[]>()
	const fileContentIds: string[] = []
	await Promise.all(
		fileContent.map(async (content) => {
			const res = await prisma.content.create({ data: content, select: { id: true } })
			fileContentIds.push(res.id)
			const fileType = idToFileType.get(content.objectId!)!
			if (!contentByFileType.has(fileType)) contentByFileType.set(fileType, [])
			contentByFileType.get(fileType)!.push(res.id)
		})
	)

	await prisma.contentTagsOnContent.createMany({
		data: [
			...fileContentIds.flatMap(
				(contentID) =>
					[
						{
							tagCategory: "DocumentType",
							tagName: "Reference",
							contentID: contentID,
						},
						{
							contentID,
							tagName: "Object",
							tagCategory: "ContentType",
						},
					] satisfies Prisma.ContentTagsOnContentCreateManyInput[]
			),

			...urlContent.flatMap((cont) => {
				const contentID = cont.id
				return [
					{
						tagCategory: "DocumentType",
						tagName: "Reference",
						contentID: contentID,
					},
					{
						contentID,
						tagName: "Link",
						tagCategory: "ContentType",
					},
				] satisfies Prisma.ContentTagsOnContentCreateManyInput[]
			}),
		],
	})

	console.log(
		`Uploaded ${ids.size} files (${Object.entries(hanoverData).length} from Hanover Data.zip) to S3 and created content rows for them`
	)

	const [admin, emp1, emp2] = await Promise.all(
		["cccadmin@calebc.co", "cccemp1@calebc.co", "cccemp2@calebc.co"].map((email) =>
			auth0Management.users.listUsersByEmail({ email }).then((users) => users[0])
		)
	)
	if (!admin || !emp1 || !emp2) {
		console.error(
			"Could not find one or more required users in Auth0. Make sure these users exist before running the seed script."
		)
		process.exit(1)
	}

	const thingsToFavorite = [
		...urlContent.slice(0, 3).map((c) => c.id),
		...[...contentByFileType.values()].flatMap((ids) => ids.slice(0, 1)),
	]

	await Promise.all(
		[admin, emp1, emp2].flatMap((user) =>
			thingsToFavorite.map((contentId) =>
				prisma.favoriteContent.create({
					data: {
						contentId,
						employeeId: user.user_id!,
					},
				})
			)
		)
	)

	console.log(`Favorited ${thingsToFavorite.length} content items for each of the 3 users`)
}
