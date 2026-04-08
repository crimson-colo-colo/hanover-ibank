import z from "zod"
import { db } from "../database.ts"
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
	update: authProcedure //added for the updateContent const
		.input(
			z.object({
				id: z.string(),
				modifiedAt: z.string().optional(),
				ownerName: z.string().optional(),
				expirationDate: z.string().optional(),
			})
		)
		.mutation(async (opts) => {
			const updated = await db.content.update({
				where: { id: opts.input.id },
				data: {
					lastModifiedDate: opts.input.modifiedAt ? new Date(opts.input.modifiedAt) : undefined,
					expirationDate: opts.input.expirationDate
						? new Date(opts.input.expirationDate)
						: undefined,
					owner: opts.input.ownerName
						? {
								update: {
									name: opts.input.ownerName,
								},
							}
						: undefined,
				},
			})
			return updated
		}),
})
