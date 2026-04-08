import { TRPCError } from "@trpc/server"
import { auth0Management } from "../auth.ts"
import { db } from "../database.ts"
import { EmployeeRole } from "../generated/prisma/enums.ts"
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
})
