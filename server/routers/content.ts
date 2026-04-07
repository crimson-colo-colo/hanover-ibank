import z from "zod"
import { db } from "../database.ts"
import { EmployeeRole } from "../generated/prisma/enums.ts"
import { bucketName, s3 } from "../s3.ts"
import { publicProcedure, router } from "../trpc.ts"

export const contentRouter = router({
	list: publicProcedure
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
})
