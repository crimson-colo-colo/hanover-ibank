import { v4 as uuidv4 } from "uuid"
import z from "zod"
import { db } from "../database.ts"
import {
	ContentStatus,
	ContentType,
	EmployeeRole,
	TagCategory,
} from "../generated/prisma/browser.ts"
import { auth0Cache } from "../lib/auth0.ts"
import { embedFile } from "../lib/embedFile.ts"
import { getFileTypeFromFile } from "../lib/filetype.ts"
import { getGravatarUrl, isoDateToTimestamp } from "../lib.ts"
import { bucketName, s3 } from "../s3.ts"
import { authProcedure, router } from "../trpc.ts"

const baseSchema = z.object({
	name: z.string().max(250).min(3),
	ownerId: z.string().max(320),
	lastModifiedDate: z.iso.date(),
	expirationDate: z.iso.date(),
	status: z.enum(Object.values(ContentStatus)),
	tags: z.array(
		z.object({
			category: z.enum(Object.values(TagCategory)),
			name: z.string().min(1).max(50),
		})
	),
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
	createContent: authProcedure.input(contentFormSchema).mutation(async (opts) => {
		let objectId: string | undefined
		if (opts.input.contentType === ContentType.Object) {
			const buffer = Buffer.from(opts.input.file, "base64")
			objectId = uuidv4()
			const fileType = await getFileTypeFromFile(opts.input.name, buffer)
			await s3.putObject({
				Bucket: bucketName,
				Key: objectId,
				Body: buffer,
				Metadata: {
					filetype: fileType,
				},
			})
		}
		const content = await db.content.create({
			data: {
				title: opts.input.name,
				type: opts.input.contentType,
				lastModifiedDate: isoDateToTimestamp(opts.input.lastModifiedDate),
				expirationDate: isoDateToTimestamp(opts.input.expirationDate),
				ownerId: opts.input.ownerId,
				status: opts.input.status,
				url: opts.input.contentType === ContentType.Link ? opts.input.url : undefined,
				objectId: objectId,
				tags: {
					create: opts.input.tags.map((tag) => ({
						tag: {
							connectOrCreate: {
								where: {
									category_name: {
										category: tag.category,
										name: tag.name,
									},
								},
								create: {
									category: tag.category,
									name: tag.name,
								},
							},
						},
					})),
				},
			},
			include: { tags: true },
		})
		await embedFile(content)
		return content
	}),
	searchUsers: authProcedure
		.input(z.object({ query: z.string(), roles: z.array(z.enum(Object.values(EmployeeRole))) }))
		.query(async (opts) => {
			const auth0Users = await auth0Cache.listUsers({
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
