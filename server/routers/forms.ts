import { v4 as uuidv4 } from "uuid"
import z from "zod"
import { auth0Management } from "../auth.ts"
import { db } from "../database.ts"
import {
	ContentStatus,
	ContentType,
	DocumentType,
	EmployeeRole,
} from "../generated/prisma/browser.ts"
import { getGravatarUrl, isoDateToTimestamp } from "../lib.ts"
import { bucketName, s3 } from "../s3.ts"
import { authProcedure, publicProcedure, router } from "../trpc.ts"

const baseSchema = z.object({
	name: z.string().max(250).min(3),
	ownerId: z.string().max(320),
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

export const formsRouter = router({
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
				ownerId: opts.input.ownerId,
				intendedAudience: opts.input.intendedAudience,
				url: opts.input.contentType === ContentType.Link ? opts.input.url : undefined,
				objectId: objectId,
			},
		})
		console.log(content)
		return content
	}),
	searchUsers: authProcedure
		.input(z.object({ query: z.string(), roles: z.array(z.enum(Object.values(EmployeeRole))) }))
		.query(async (opts) => {
			const auth0Users = await auth0Management.users.list({
				q: opts.input.query,
			})
			const users = await db.employee.findMany({
				where: {
					id: {
						in: auth0Users.data.map((user) => user.user_id!),
					},
					role:
						opts.input.roles.length > 0
							? {
									in: opts.input.roles,
								}
							: undefined,
				},
				take: 10,
			})

			return users.map((user) => {
				const auth0User = auth0Users.data.find((u) => u.user_id === user.id)
				return {
					id: user.id,
					name: auth0User?.name || "Unknown",
					email: auth0User?.email || "Unknown",
					username: auth0User?.username || "Unknown",
					role: user.role,
					picture: auth0User?.picture || getGravatarUrl(auth0User?.email || ""),
				}
			})
		}),
})
