import { TRPCError } from "@trpc/server"
import * as jose from "jose"
import z from "zod"
import { auth0Management } from "../auth.ts"
import { db } from "../database.ts"
import { env } from "../env.ts"
import { ContentStatus, DocumentType, EmployeeRole } from "../generated/prisma/enums.ts"
import { isoDateToTimestamp } from "../lib.ts"
import { bucketName, s3 } from "../s3.ts"
import { authProcedure, router } from "../trpc.ts"

export const contentRouter = router({
	list: authProcedure.query(async (opts) => {
		const user = await db.employee.findUnique({
			where: {
				id: opts.ctx.auth.sub,
			},
		})
		if (!user?.role) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "user does not exist",
			})
		}
		const data = await db.content.findMany({
			where:
				user.role === EmployeeRole.Admin
					? {
							// no filters; fetch everything
						}
					: {
							intendedAudience: {
								has: user.role,
							},
						},
			include: {
				owner: true,
			},
		})

		const users = await auth0Management.users.list()

		const metadata = await Promise.all(
			data
				.filter((content) => content.type === "Object")
				.map(
					async (content) =>
						[content.id, await s3.statObject(bucketName, content.objectId!)] as const
				)
		)

		return {
			role: user.role,
			content: data.map((content) => {
				const owner = users.data.find((u) => u.user_id === content.ownerId)!
				return {
					...content,
					owner: {
						...content.owner,
						name: owner.name ?? owner.nickname ?? owner.username!,
						email: owner.email!,
						username: owner.username!,
					},
				}
			}),
			objectMetadata: new Map(metadata),
		}
	}),

	update: authProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(3).max(250),
				ownerId: z.string(),
				intendedAudience: z.array(z.enum(Object.values(EmployeeRole))).min(1),
				lastModifiedDate: z.iso.date(),
				expirationDate: z.iso.date(),
				documentType: z.enum(Object.values(DocumentType)),
				status: z.enum(Object.values(ContentStatus)),
			})
		)
		.mutation(async (opts) => {
			const updated = await db.content.update({
				where: { id: opts.input.id },
				data: {
					title: opts.input.title,
					owner: { connect: { id: opts.input.ownerId } },
					intendedAudience: opts.input.intendedAudience,
					lastModifiedDate: isoDateToTimestamp(opts.input.lastModifiedDate),
					expirationDate: isoDateToTimestamp(opts.input.expirationDate),
					documentType: opts.input.documentType,
					status: opts.input.status,
				},
			})
			return updated
		}),

	download: authProcedure.input(z.object({ id: z.string() })).query(async (opts) => {
		const content = await db.content.findUnique({
			where: { id: opts.input.id },
		})
		if (!content) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Content not found",
			})
		}

		if (content.type === "Link") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Content is a link",
				cause: content.url,
			})
		}

		const token = await new jose.SignJWT({ contentId: content.id })
			.setProtectedHeader({ alg: "HS256" })
			.setExpirationTime("5m")
			.sign(new TextEncoder().encode(env.APP_SECRET))

		return { url: `/content/download?token=${token}` }
	}),
})
