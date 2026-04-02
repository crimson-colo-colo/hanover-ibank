import crypto from "node:crypto"
import { createReadStream } from "node:fs"
import fs from "node:fs/promises"
import { PrismaPg } from "@prisma/adapter-pg"
import * as Minio from "minio"
import { v4 as uuidv4 } from "uuid"
import {
	ContentStatus,
	ContentType,
	DocumentType,
	EmployeeRole,
	type Prisma,
	PrismaClient,
} from "../server/generated/prisma/client.ts"

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

export const s3 = new Minio.Client({
	endPoint: process.env.S3_ENDPOINT!,
	port: +process.env.S3_PORT!,
	useSSL: process.env.S3_SSL! === "true",
	accessKey: process.env.S3_ACCESS_KEY!,
	secretKey: process.env.S3_SECRET_KEY!,
})

export const bucketName = process.env.S3_BUCKET!

if (!(await s3.bucketExists(bucketName))) {
	await s3.makeBucket(bucketName)
}

const objects = await new Promise<string[]>((resolve) => {
	const names: string[] = []
	s3.listObjects(bucketName)
		.on("data", (obj) => obj.name && names.push(obj.name))
		.on("end", () => resolve(names))
})

await Promise.all(objects.map((name) => s3.removeObject(bucketName, name, { forceDelete: true })))

main()
	.catch((e) => {
		console.error("❌ Error seeding database:", e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

async function main() {
	await prisma.$connect()

	const [employees, content] = await Promise.all([prisma.employee.count(), prisma.content.count()])
	if (employees > 0 || content > 0) {
		process.stdout.write(
			`⚠️ \x1b[33mDatabase already has data (employee: ${employees}, content: ${content}. Continuing will erase existing data and cannot be undone. Really continue[y/N] \x1b[0m`
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

	await prisma.$transaction([prisma.employee.deleteMany(), prisma.content.deleteMany()])

	// Wilson Harper, wharper@hanover.com, Business Analyst
	// Austin Johnson, ajohnson@hanover.com, Underwriter
	// Jack Needleham, jneedleham@hanover.com, Business Analyst
	// Sarah Miles, smiles@hanover.com, Underwriter
	// Emily Cane, ecane@hanover.com,

	const employeeData = [
		{
			name: "Wilson Harper",
			email: "wharper@hanover.com",
			role: EmployeeRole.BusinessAnalyst,
		},
		{
			name: "Austin Johnson",
			email: "ajohnson@hanover.com",
			role: EmployeeRole.Underwriter,
		},
		{
			name: "Jack Needleham",
			email: "jneedleham@hanover.com",
			role: EmployeeRole.BusinessAnalyst,
		},
		{
			name: "Sarah Miles",
			email: "smiles@hanover.com",
			role: EmployeeRole.Underwriter,
		},
		{
			name: "Emily Cane",
			email: "ecane@hanover.com",
			role: EmployeeRole.BusinessAnalyst,
		},
	]

	const [wilson, austin, jack, sarah, emily] = await prisma.$transaction(
		employeeData.map((employee) =>
			prisma.employee.create({
				data: {
					...employee,
					avatarUrl: getAvatarUrl(employee.email),
				},
				select: { id: true },
			})
		)
	)

	console.log(`Created ${employeeData.length} employee rows`)

	const contentData = [
		{
			title: "Risk Meter",
			description: "",
			type: ContentType.Link,
			url: "https://riskmeter.corelogic.com/",
			ownerId: sarah.id,
			lastModifiedDate: new Date("2026-03-27"),
			expirationDate: new Date("2027-01-01"),
			documentType: DocumentType.Workflow,
			status: ContentStatus.Complete,
		},
		{
			title: "Kentucky Tax Law",
			description: "",
			type: ContentType.Link,
			url: "https://revenue.ky.gov/Get-Help/pages/research-tax-laws.aspx",
			ownerId: wilson.id,
			lastModifiedDate: new Date("2026-02-04"),
			expirationDate: new Date("2026-04-15"),
			documentType: DocumentType.Reference,
			status: ContentStatus.UnderReview,
		},
		{
			title: "Image Editor",
			description: "",
			type: ContentType.Link,
			url: "https://www.adobe.com/express/feature/image/editor",
			ownerId: emily.id,
			lastModifiedDate: new Date("2025-10-26"),
			expirationDate: new Date("2027-01-01"),
			documentType: DocumentType.Workflow,
			status: ContentStatus.Complete,
		},
		{
			title: "Workstation",
			description: "",
			type: ContentType.Link,
			url: "https://drive.google.com/drive/my-drive",
			ownerId: austin.id,
			lastModifiedDate: new Date("2025-07-13"),
			expirationDate: new Date("2026-06-15"),
			documentType: DocumentType.Workflow,
			status: ContentStatus.Incomplete,
		},
		{
			title: "Oregon Tax Law",
			description: "",
			type: ContentType.Link,
			url: "https://www.oregon.gov/dor/pages/rules-laws.aspx",
			ownerId: jack.id,
			lastModifiedDate: new Date("2025-12-12"),
			expirationDate: new Date("2026-04-15"),
			documentType: DocumentType.Reference,
			status: ContentStatus.Complete,
		},
	] satisfies Prisma.ContentCreateManyInput[]

	await prisma.content.createMany({ data: contentData })

	console.log(`Created ${contentData.length} content rows`)

	const files = await fs.readdir("./prisma/seed-data")
	const ids = new Map<string, string>()
	for (const file of files) {
		const id = uuidv4()
		const f = createReadStream(`./prisma/seed-data/${file}`)
		await s3.putObject(bucketName, id, f)
		ids.set(file, id)
	}

	await prisma.content.createMany({
		data: [
			...ids.entries().map(
				([filename, id]) =>
					({
						title: filename,
						type: ContentType.Object,
						ownerId: wilson.id,
						documentType: DocumentType.Reference,
						expirationDate: new Date("2026-12-31"),
						objectId: id,
					}) satisfies Prisma.ContentCreateManyInput
			),
		],
	})

	console.log(`Uploaded ${ids.size} files to S3 and created content rows for them`)
}

// returns the gravtar url for the given email
function getAvatarUrl(email: string) {
	const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex")
	return `https://www.gravatar.com/avatar/${hash}?d=identicon`
}
