import { UTCDate } from "@date-fns/utc"
import { faker } from "@faker-js/faker"
import { Temporal } from "@js-temporal/polyfill"
import { PrismaPg } from "@prisma/adapter-pg"
import type { FileType } from "@shared/filetype.ts"
import { auth0Management } from "../server/auth.ts"
import {
	ContentStatus,
	EmployeeRole,
	type Prisma,
	PrismaClient,
	TagCategory,
	ThreadStatus,
} from "../server/generated/prisma/client.ts"
import { generateDefaultAvatar } from "../server/lib/avatar.ts"
import { bucketName, s3 } from "../server/s3.ts"
import { fileContentData, objectIdToFileType, uploadFilesToS3 } from "./seed-data/files.ts"
import { linkContentData } from "./seed-data/links.ts"
import { employeeData, userRoleById } from "./seed-data/users.ts"

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

main()
	.catch((e) => {
		console.error("❌ Error seeding database:", e)
		process.exit(1)
	})
	.finally(async () => {
		console.log("✅ Finished seeding database")
		await prisma.$disconnect()
	})

async function main() {
	await prisma.$connect()
	await confirmOverwrite()
	console.log("🌱 Seeding database...")

	await wipeDBandS3()

	await createUsersAndAvatars()
	await createTags()
	const linkContent = await createLinkContent()
	await uploadFilesToS3()
	const { fileContent, fileTypeToContent } = await createFileContent()
	await createContentTags(fileContent, linkContent)

	console.log(`Uploaded ${fileContent.length} files to S3 and created content rows for them`)

	await createFavoriteContent(linkContent, fileTypeToContent)

	await createUserActivity()

	await checkoutFiles(fileContent)

	await createContentThreads()

	await createTimestamps()
}

async function confirmOverwrite() {
	const [employees, content] = await Promise.all([prisma.employee.count(), prisma.content.count()])
	if (employees > 0 || content > 0) {
		process.stdout.write(
			`⚠️ \x1b[33mDatabase already has data (employee: ${employees}, content: ${content}. Continuing will erase existing data and cannot be undone. Really continue? [y/N] \x1b[0m`
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
			process.exit(0)
		}
	}
}

async function wipeDBandS3() {
	await prisma.$transaction([
		prisma.talkThreadComment.deleteMany(),
		prisma.contentTalkThread.deleteMany(),
		prisma.userActivity.deleteMany(),
		prisma.favoriteContent.deleteMany(),
		prisma.contentTag.deleteMany(),
		prisma.tag.deleteMany(),
		prisma.content.deleteMany(),
		prisma.employee.deleteMany(),
		prisma.recentTimestamps.deleteMany(),
	])

	console.log("Emptied database tables")

	const objects = await s3.listObjectsV2({ Bucket: bucketName, MaxKeys: 1000 })
	if (objects.Contents && objects.Contents.length > 0) {
		await s3.deleteObjects({
			Bucket: bucketName,
			Delete: { Objects: objects.Contents.map((obj) => ({ Key: obj.Key! })) },
		})
	}

	console.log("Emptied S3 bucket")
}

async function createUsersAndAvatars() {
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

	const users = await auth0Management.users.list()

	await Promise.all(
		employeeData.map(async ({ id }) => {
			const user = users.data.find((u) => u.user_id === id)!
			const avatar =
				Math.random() < 0.8
					? await downloadAvatar()
					: generateDefaultAvatar(user.name ?? user.email!)
			console.log(`Uploading default avatar for user ${user.name ?? "(unknown)"} to S3...`)
			await s3.putObject({
				Bucket: bucketName,
				Key: `avatar/${id}.png`,
				Body: avatar,
			})
		})
	)

	console.log(`Created ${employeeData.length} employee rows`)
}

async function downloadAvatar() {
	const response = await fetch(faker.image.personPortrait({ size: 256 }))
	return response.arrayBuffer().then((buffer) => Buffer.from(buffer))
}

async function createLinkContent() {
	const linkContent = await prisma.content.createManyAndReturn({
		data: linkContentData,
		select: { id: true, ownerId: true },
	})
	console.log(`Created ${linkContentData.length} link content rows`)
	return linkContent
}

async function createFileContent() {
	const fileTypeToContent = new Map<FileType, string[]>()
	const fileContent = await prisma.content.createManyAndReturn({
		data: fileContentData(),
		select: {
			id: true,
			ownerId: true,
			objectId: true,
		},
	})
	for (const content of fileContent) {
		const fileType = objectIdToFileType.get(content.objectId!)!
		if (!fileTypeToContent.has(fileType)) {
			fileTypeToContent.set(fileType, [])
		}
		fileTypeToContent.get(fileType)!.push(content.id)
	}
	return { fileContent, fileTypeToContent }
}

async function createTags() {
	await prisma.tag.createMany({
		data: [
			{
				name: "Workflow",
				category: TagCategory.DocumentType,
			},
			{
				name: "Reference",
				category: TagCategory.DocumentType,
			},
			...Object.values(EmployeeRole).map((role) => ({
				name: role,
				category: TagCategory.IntendedAudience,
			})),
		],
	})
}

async function createContentTags(
	fileContent: { id: string; objectId: string | null; ownerId: string }[],
	linkContent: { id: string; ownerId: string }[]
) {
	await prisma.contentTag.createMany({
		data: [
			...fileContent.flatMap(generateContentTags),
			...linkContent.flatMap(generateContentTags),
		],
	})
}

const roles = Object.values(EmployeeRole)
function generateContentTags(content: { id: string; ownerId: string }) {
	const tags: Prisma.ContentTagCreateManyInput[] = []
	const documentTypeTag = Math.random() < 0.5 ? "Reference" : "Workflow"
	tags.push({
		contentId: content.id,
		tagName: documentTypeTag,
		tagCategory: TagCategory.DocumentType,
	})

	const ownerRole = userRoleById(content.ownerId)!
	tags.push({
		contentId: content.id,
		tagName: ownerRole,
		tagCategory: TagCategory.IntendedAudience,
	})

	const numRandomRoles = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 3) + 1
	const rolesLeftToAssign = roles.filter((r) => r !== ownerRole)
	for (let i = 0; i < numRandomRoles && rolesLeftToAssign.length > 0; i++) {
		const index = Math.floor(Math.random() * rolesLeftToAssign.length)
		const randomRole = rolesLeftToAssign.splice(index, 1)[0]
		tags.push({
			contentId: content.id,
			tagName: randomRole,
			tagCategory: TagCategory.IntendedAudience,
		})
	}

	return tags
}

async function createFavoriteContent(
	linkContent: { id: string; ownerId: string }[],
	fileTypeToContent: Map<FileType, string[]>
) {
	const admin = "auth0|69d57cf83f6e9b609fe8a92f"
	const emp1 = "auth0|69d57d03e7bf39d172e84921"
	const emp2 = "auth0|69d57d0af36c0b4100640b0a"

	const thingsToFavorite = [
		...linkContent.slice(0, 3).map((c) => c.id),
		...[...fileTypeToContent.values()].flatMap((ids) => ids.slice(0, 1)),
	]

	await Promise.all(
		[admin, emp1, emp2].flatMap((userId) =>
			thingsToFavorite.map((contentId) =>
				prisma.favoriteContent.create({
					data: {
						contentId,
						employeeId: userId,
					},
				})
			)
		)
	)

	console.log(`Favorited ${thingsToFavorite.length} content items for each of the 3 users`)
}

async function createUserActivity() {
	const activeWeekdays = [0.05, 0.9, 0.7, 0.8, 0.6, 0.4, 0.1] // Sunday to Saturday
	const data: Prisma.UserActivityCreateManyInput[] = []
	for (const { id } of employeeData) {
		// insert activity for the past 365 days
		for (let i = 1; i < 365; i++) {
			const date = new UTCDate()
			date.setHours(12, 0, 0, 0)
			date.setDate(date.getDate() - i)
			const weekday = date.getDay()
			if (Math.random() < activeWeekdays[weekday]) {
				const truncated = Temporal.Instant.fromEpochMilliseconds(date.getTime()).round({
					roundingMode: "floor",
					smallestUnit: "second",
				})
				const hour = truncated.round({
					roundingMode: "floor",
					smallestUnit: "hour",
				})
				const day = truncated.round({
					roundingMode: "floor",
					smallestUnit: "hour",
					roundingIncrement: 24,
				})
				data.push({
					employeeId: id,
					day: new UTCDate(day.epochMilliseconds).toISOString(),
					hour: new UTCDate(hour.epochMilliseconds).toISOString(),
					path: `content.list`,
					timestamp: new UTCDate(truncated.epochMilliseconds).toISOString(),
					count: 1,
				})
			}
		}
	}

	await prisma.userActivity.createMany({ data })
	console.log(`Created ${data.length} user activity entries over the past year`)
}

async function checkoutFiles(
	fileContent: { id: string; objectId: string | null; ownerId: string }[]
) {
	const numToCheckOut = Math.floor(fileContent.length * 0.2)
	const toCheckOut = [...fileContent].sort(() => 0.5 - Math.random()).slice(0, numToCheckOut)
	for (const content of toCheckOut) {
		const roles = await prisma.contentTag
			.findMany({
				where: { contentId: content.id, tagCategory: TagCategory.IntendedAudience },
				select: { tagName: true },
			})
			.then((tags) => tags.map((t) => t.tagName as EmployeeRole))
		const eligibleEmployees = employeeData.filter((e) => roles.includes(e.role))
		const employee = eligibleEmployees[Math.floor(Math.random() * eligibleEmployees.length)]
		await prisma.content.update({
			where: { id: content.id },
			data: {
				checkedOutById: employee.id,
				status: ContentStatus.UnderReview,
			},
		})
	}
	console.log(`Checked out ${toCheckOut.length} files`)
}

async function createContentThreads() {
	const contentItems = await prisma.content.findMany({
		select: { id: true },
	})

	const threadData: Prisma.ContentTalkThreadCreateManyInput[] = []
	const commentData: Omit<Prisma.TalkThreadCommentCreateManyInput, "threadId">[][] = []

	for (const content of contentItems) {
		const numThreads = Math.floor(Math.random() * 3) + 1
		for (let i = 0; i < numThreads; i++) {
			const createdById = employeeData[Math.floor(Math.random() * employeeData.length)].id
			const numComments = Math.random() < 0.5 ? 1 : Math.floor(Math.random() * 8) + 1
			const ONE_DAY = 24 * 60 * 60 * 1000
			// within the past 30 days, at least one day ago
			const createdAt = new Date(Date.now() - ONE_DAY - Math.floor(Math.random() * 30 * ONE_DAY))
			let offsetMs = 0
			threadData.push({
				contentId: content.id,
				createdById: createdById,
				createdAt,
				status:
					Math.random() < 0.6
						? ThreadStatus.Open
						: Math.random() < 0.5
							? ThreadStatus.Resolved
							: ThreadStatus.Archived,
				title:
					Math.random() < 0.4
						? `Question about ${faker.company.buzzAdjective()} ${faker.company.buzzAdjective()} ${faker.company.buzzNoun()}`
						: Math.random() < 0.4
							? `Discussion on ${faker.hacker.adjective()} ${faker.hacker.adjective()} ${faker.hacker.noun()}`
							: `Feedback on ${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} ${faker.commerce.product()}`,
			})
			commentData.push(
				Array.from({ length: numComments }, (_, i) => {
					const sentences = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () =>
						Math.random() < 0.5 ? faker.lorem.sentence() : faker.hacker.phrase()
					)
					// add random number of seconds to createdAt for each comment to ensure ordering, between 120 sec and 3600 sec (1 hour)
					const differenceSeconds = i === 0 ? 0 : 120 + Math.floor(Math.random() * (3600 - 120))
					offsetMs += differenceSeconds * 1000
					return {
						body: sentences.join(" "),
						createdAt: new Date(createdAt.getTime() + offsetMs),
						authorId:
							i === 0
								? createdById
								: employeeData[Math.floor(Math.random() * employeeData.length)].id,
					}
				})
			)
		}
	}

	const threads = await prisma.contentTalkThread.createManyAndReturn({
		data: threadData,
		select: { id: true },
	})

	console.log(`Created ${threadData.length} threads`)

	await prisma.talkThreadComment.createMany({
		data: threads.flatMap((thread, index) =>
			commentData[index].map((comment) => ({
				...comment,
				threadId: thread.id,
			}))
		),
	})

	console.log(`Created ${commentData.flat().length} comments across all threads`)
}

async function createTimestamps() {
	const contentItems = await prisma.content.findMany({
		select: { id: true },
	})
	for (const content of contentItems) {
		for (const employee of employeeData) {
			const employeeId = employee.id
			const contentId = content.id
			const ONE_DAY = 24 * 60 * 60 * 1000
			// within the past 30 days, at least one day ago
			const recentlyViewed = new Date(
				Date.now() - ONE_DAY - Math.floor(Math.random() * 30 * ONE_DAY)
			)
			const recentlyEdited = new Date(
				Date.now() - ONE_DAY - Math.floor(Math.random() * 30 * ONE_DAY)
			)
			//Generate a random view count for each piece of content between 1 and 100 (inclusive)
			const viewCount = Math.floor(Math.random() * 100) + 1
			await prisma.recentTimestamps.create({
				data: {
					recentlyViewed: recentlyViewed,
					recentlyEdited: recentlyEdited,
					viewCount: viewCount,
					employeeId: employeeId,
					contentId: contentId,
				},
			})
		}
	}
	console.log(
		`Created ${contentItems.length * employeeData.length} timestamps across ${contentItems.length} content items and ${employeeData.length} employees`
	)
}
