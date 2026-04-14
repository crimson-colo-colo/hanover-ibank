import { existsSync } from "node:fs"
import fs, { readFile } from "node:fs/promises"
import path from "node:path"
import { PrismaPg } from "@prisma/adapter-pg"
import type { FileType } from "@shared/filetype.ts"
import { unzipSync } from "fflate"
import { v4 as uuidv4 } from "uuid"
import { auth0Management } from "../server/auth.ts"
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
import {fileTypeFromBuffer} from "file-type";

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
			return
		}
	}

	console.log("🌱 Seeding database...")

	await prisma.$transaction([prisma.content.deleteMany(), prisma.employee.deleteMany()])

	const objects = await s3.listObjectsV2({ Bucket: bucketName, MaxKeys: 1000 })
	if (objects.Contents && objects.Contents.length > 0) {
		await s3.deleteObjects({
			Bucket: bucketName,
			Delete: { Objects: objects.Contents.map((obj) => ({ Key: obj.Key! })) },
		})
	}
	// admins: admin, mjordan, wharper
	// underwriter: emp1
	// business analyst: emp2
	const employeeData = [
		{
			id: "auth0|69d3f8c36ddd007770a559bb",
			role: EmployeeRole.BusinessAnalyst,
		},
		{
			id: "auth0|69d57c86bebf497028094f86",
			role: EmployeeRole.Admin,
		},
		{
			id: "auth0|69d57cb6f36c0b4100640abb",
			role: EmployeeRole.Underwriter,
		},
		{
			id: "auth0|69db05b92c0b718e1d54aaec",
			role: EmployeeRole.BusinessAnalyst,
		},
		{
			id: "auth0|69d57cd6e7bf39d172e848f0",
			role: EmployeeRole.Underwriter,
		},
		{
			id: "auth0|69d57cdf3f6e9b609fe8a916",
			role: EmployeeRole.BusinessAnalyst,
		},
		{
			id: "auth0|69d57cf83f6e9b609fe8a92f",
			role: EmployeeRole.Admin,
		},
		{
			id: "auth0|69d57d03e7bf39d172e84921",
			role: EmployeeRole.Underwriter,
		},
		{
			id: "auth0|69d57d0af36c0b4100640b0a",
			role: EmployeeRole.BusinessAnalyst,
		},
		{
			id: "auth0|69d57d78bebf497028095069",
			role: EmployeeRole.Admin,
		},
		{
			id: "auth0|69d57d91f36c0b4100640b99",
			role: EmployeeRole.Underwriter,
		},
		{
			id: "auth0|69d57d9d3f6e9b609fe8a9c4",
			role: EmployeeRole.BusinessAnalyst,
		},
		{
			id: "auth0|69d57daee7bf39d172e849b0",
			role: EmployeeRole.Underwriter,
		},
		{
			id: "auth0|69d57dc6e7bf39d172e849cb",
			role: EmployeeRole.BusinessAnalyst,
		},
	]

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

	const contentData = [
		...[
			{
				title: "Risk Meter",
				description: "",
				type: ContentType.Link,
				url: "https://riskmeter.corelogic.com/",
				lastModifiedDate: new Date("2026-03-27"),
				expirationDate: new Date("2027-01-01"),
				documentType: DocumentType.Workflow,
				status: ContentStatus.Complete,
			},
			{
				title: "Image Editor",
				description: "",
				type: ContentType.Link,
				url: "https://www.adobe.com/express/feature/image/editor",
				lastModifiedDate: new Date("2025-10-26"),
				expirationDate: new Date("2027-01-01"),
				documentType: DocumentType.Workflow,
				status: ContentStatus.Complete,
			},
			{
				title: "Underwriter Workstation",
				description: "",
				type: ContentType.Link,
				url: "https://drive.google.com/drive/my-drive",
				lastModifiedDate: new Date("2025-07-13"),
				expirationDate: new Date("2026-06-15"),
				documentType: DocumentType.Workflow,
				status: ContentStatus.Incomplete,
			},
			{
				title: "Document Signing",
				description: "",
				type: ContentType.Link,
				url: "https://www.docusign.com/",
				lastModifiedDate: new Date("2025-11-01"),
				expirationDate: new Date("2027-01-01"),
				documentType: DocumentType.Workflow,
				status: ContentStatus.UnderReview,
			},
			{
				title: "Desktop Management Tool",
				description: "",
				type: ContentType.Link,
				url: "https://www.teamviewer.com/en-us/",
				lastModifiedDate: new Date("2025-09-15"),
				expirationDate: new Date("2026-12-31"),
				documentType: DocumentType.Workflow,
				status: ContentStatus.Incomplete,
			},
			{
				title: "Process Automation Tool",
				description: "",
				type: ContentType.Link,
				url: "https://www.flowforma.com/",
				lastModifiedDate: new Date("2025-08-20"),
				expirationDate: new Date("2027-01-01"),
				documentType: DocumentType.Workflow,
				status: ContentStatus.Complete,
			},
			{
				title: "Knowledge Base",
				description: "",
				type: ContentType.Link,
				url: "https://www.genre.com/us/knowledge?filters=article-type:publication,genre-languages:en&page=1&facet=all",
				lastModifiedDate: new Date("2025-10-05"),
				expirationDate: new Date("2026-10-01"),
				documentType: DocumentType.Reference,
				status: ContentStatus.UnderReview,
			},
			{
				title: "Image Processing System",
				description: "",
				type: ContentType.Link,
				url: "https://www.adobe.com/express/feature/image/editor",
				lastModifiedDate: new Date("2025-07-30"),
				expirationDate: new Date("2027-01-01"),
				documentType: DocumentType.Workflow,
				status: ContentStatus.Incomplete,
			},
			{
				title: "Flood Information",
				description: "",
				type: ContentType.Link,
				url: "https://msc.fema.gov/portal/home",
				lastModifiedDate: new Date("2025-09-10"),
				expirationDate: new Date("2026-12-31"),
				documentType: DocumentType.Reference,
				status: ContentStatus.Complete,
			},
			{
				title: "OSHA Regulations",
				description: "",
				type: ContentType.Link,
				url: "https://www.osha.gov/laws-regs",
				lastModifiedDate: new Date("2025-11-20"),
				expirationDate: new Date("2027-01-01"),
				documentType: DocumentType.Reference,
				status: ContentStatus.UnderReview,
			},
			{
				title: "Pennsylvania Schedule Rating Plan",
				description: "",
				type: ContentType.Link,
				url: "https://pcrb.com/industry-reports/schedule-rating-plan/",
				lastModifiedDate: new Date("2025-08-05"),
				expirationDate: new Date("2026-10-01"),
				documentType: DocumentType.Reference,
				status: ContentStatus.Incomplete,
			},
		].map((content) => ({
			...content,
			ownerId: nextUndewriter(),
			intendedAudience: [EmployeeRole.Underwriter],
		})),
		...[
			{
				title: "Kentucky Tax Law",
				description: "",
				type: ContentType.Link,
				url: "https://revenue.ky.gov/Get-Help/pages/research-tax-laws.aspx",
				lastModifiedDate: new Date("2026-02-04"),
				expirationDate: new Date("2026-04-15"),
				documentType: DocumentType.Reference,
				status: ContentStatus.UnderReview,
			},
			{
				title: "Oregon Tax Law",
				description: "",
				type: ContentType.Link,
				url: "https://www.oregon.gov/dor/pages/rules-laws.aspx",
				lastModifiedDate: new Date("2025-12-12"),
				expirationDate: new Date("2026-04-15"),
				documentType: DocumentType.Reference,
				status: ContentStatus.Complete,
			},
			{
				title: "States on Hold",
				description: "",
				type: ContentType.Link,
				url: "https://www.policygenius.com/homeowners-insurance/home-insurance-availability-guide-states-crisis/",
				lastModifiedDate: new Date("2025-11-15"),
				expirationDate: new Date("2026-12-31"),
				documentType: DocumentType.Reference,
				status: ContentStatus.UnderReview,
			},
			{
				title: "Error Lookup Tool",
				description: "",
				type: ContentType.Link,
				url: "https://www.google.com/",
				lastModifiedDate: new Date("2025-10-01"),
				expirationDate: new Date("2027-01-01"),
				documentType: DocumentType.Reference,
				status: ContentStatus.Incomplete,
			},
			{
				title: "Workflow Management Platform",
				description: "",
				type: ContentType.Link,
				url: "https://monday.com/",
				lastModifiedDate: new Date("2025-09-20"),
				expirationDate: new Date("2027-01-01"),
				documentType: DocumentType.Reference,
				status: ContentStatus.Complete,
			},
			{
				title: "Claim Search",
				description: "",
				type: ContentType.Link,
				url: "https://claimsearch.iso.com/index.asp",
				lastModifiedDate: new Date("2025-08-10"),
				expirationDate: new Date("2026-12-31"),
				documentType: DocumentType.Reference,
			},
			{
				title: "Business Analyst Guide",
				description: "",
				type: ContentType.Link,
				url: "https://www.iiba.org/career-resources/a-business-analysis-professionals-foundation-for-success/babok/",
				lastModifiedDate: new Date("2025-07-01"),
				expirationDate: new Date("2027-01-01"),
				documentType: DocumentType.Reference,
			},
			{
				title: "State Research Guides",
				description: "",
				type: ContentType.Link,
				url: "https://www.namic.org/compliance/50-state-research-guides/",
				lastModifiedDate: new Date("2025-11-05"),
				expirationDate: new Date("2026-10-01"),
				documentType: DocumentType.Reference,
			},
			{
				title: "Policy Tracking Software",
				description: "",
				type: ContentType.Link,
				url: "https://www.agencybloc.com/",
				lastModifiedDate: new Date("2025-10-15"),
				expirationDate: new Date("2027-01-01"),
				documentType: DocumentType.Reference,
			},
			{
				title: "Latest Insurance News",
				description: "",
				type: ContentType.Link,
				url: "https://www.insurancejournal.com/",
				lastModifiedDate: new Date("2025-09-05"),
				expirationDate: new Date("2026-12-31"),
				documentType: DocumentType.Reference,
			},
		].map((content) => ({
			...content,
			ownerId: nextAnalyst(),
			intendedAudience: [EmployeeRole.BusinessAnalyst],
		})),
	] satisfies Prisma.ContentCreateManyInput[]

	const contentDataIds = await Promise.all(
		contentData.map((content) =>
			prisma.content
				.create({
					data: content,
					select: { id: true },
				})
				.then((res) => res.id)
		)
	)

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
		const type = (await fileTypeFromBuffer(buffer))
		let mimeType: { mimeType: string } | {} = {}
		if (type) mimeType = {mimeType: type.mime}
		await s3.putObject({
			Bucket: bucketName,
			Key: id,
			Body: buffer,
			ContentType: mimeFromFileType(fileType),
			Metadata: {
				filetype: fileType,
				...mimeType
			},
		})
		ids.set(path.basename(filename), id)
	}

	const fileContent = [
		...ids.entries().map(([filename, id]) => {
			const daysEditedAgo = Math.floor(Math.random() * 365)
			const lastModifiedDate = new Date()
			lastModifiedDate.setDate(lastModifiedDate.getDate() - daysEditedAgo)
			const expiresInDays = 30 + Math.floor(Math.random() * 365)
			const expirationDate = new Date()
			expirationDate.setDate(expirationDate.getDate() + expiresInDays)
			const underwriter = Math.random() < 0.5
			const owner = underwriter ? nextUndewriter() : nextAnalyst()
			return {
				title: filename,
				type: ContentType.Object,
				ownerId: owner,
				lastModifiedDate,
				expirationDate,
				documentType: Math.random() < 0.5 ? DocumentType.Reference : DocumentType.Workflow,
				objectId: id,
				intendedAudience: [underwriter ? EmployeeRole.Underwriter : EmployeeRole.BusinessAnalyst],
			} satisfies Prisma.ContentCreateManyInput
		}),
	]

	const contentByFileType = new Map<FileType, string[]>()
	await Promise.all(
		fileContent.map((content) =>
			prisma.content
				.create({
					data: content,
					select: { id: true },
				})
				.then((res) => {
					const fileType = idToFileType.get(content.objectId!)!
					if (!contentByFileType.has(fileType)) {
						contentByFileType.set(fileType, [])
					}
					contentByFileType.get(fileType)!.push(res.id)
				})
		)
	)

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
		...contentDataIds.slice(0, 3),
		...contentByFileType.entries().flatMap(([fileType, ids]) => ids.slice(0, 1)),
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
