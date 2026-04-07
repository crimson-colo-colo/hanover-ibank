import { v4 as uuidv4 } from "uuid"
import z from "zod"
import { db } from "../database.ts"
import {
	ContentStatus,
	ContentType,
	DocumentType,
	EmployeeRole,
} from "../generated/prisma/browser.ts"
import { bucketName, s3 } from "../s3.ts"
import { publicProcedure, router } from "../trpc.ts"

const baseSchema = z.object({
	name: z.string().max(250).min(3),
	email: z.email().max(320),
	intendedAudience: z.array(z.enum(Object.values(EmployeeRole))).min(1),
	lastModifiedDate: z.iso.date(),
	expirationDate: z.iso.date(),
	documentType: z.enum(Object.values(DocumentType)),
	documentStatus: z.enum(Object.values(ContentStatus)),
})

const linkSchema = baseSchema.extend({
	contentType: z.literal(ContentType.Link),
	url: z.url().max(2000),
})

const fileSchema = baseSchema.extend({
	contentType: z.literal(ContentType.Object),
	file: z.base64(),
})

const contentFormSchema = z.discriminatedUnion("contentType", [linkSchema, fileSchema])

export const submitRouter = router({
	createContent: publicProcedure.input(contentFormSchema).mutation(async (opts) => {
		let objectId: string | undefined
		if (opts.input.contentType === ContentType.Object) {
			objectId = uuidv4()
			await s3.putObject(bucketName, objectId, Buffer.from(opts.input.file, "base64"))
		}
		const content = await db.content.create({
			data: {
				title: opts.input.name,
				documentType: opts.input.documentType,
				type: opts.input.contentType,
				status: opts.input.documentStatus,
				lastModifiedDate: isoDateToTimestamp(opts.input.lastModifiedDate),
				expirationDate: isoDateToTimestamp(opts.input.expirationDate),
				owner: { connect: { email: opts.input.email } },
				intendedAudience: opts.input.intendedAudience,
				url: opts.input.contentType === ContentType.Link ? opts.input.url : undefined,
				objectId: objectId,
			},
		})
		console.log(content)
		return content
	}),
})

function isoDateToTimestamp(date: string) {
	return `${date}T00:00:00Z`
}
