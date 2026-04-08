import { TRPCError } from "@trpc/server"
import * as jose from "jose"
import z from "zod"
import { db } from "../database.ts"
import { env } from "../env.ts"
import { EmployeeRole } from "../generated/prisma/enums.ts"
import { bucketName, s3 } from "../s3.ts"
import { authProcedure, router } from "../trpc.ts"

export const contentRouter = router({
	list: authProcedure
		.input(z.object({ role: z.enum(Object.values(EmployeeRole)) }))
		.query(async (opts) => {
			const data = await db.content.findMany({
				where: {
					intendedAudience: {
						has: opts.input.role,
					},
				},
				include: {
					owner: true,
				},
			})

			const metadata = await Promise.all(
				data
					.filter((content) => content.type === "Object")
					.map(
						async (content) =>
							[content.id, await s3.statObject(bucketName, content.objectId!)] as const
					)
			)

			return {
				content: data,
				objectMetadata: new Map(metadata),
			}
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
