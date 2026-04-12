import z from "zod"
import { db } from "../database.ts"
import { EmployeeRole } from "../generated/prisma/enums.ts"
import { getGravatarUrl } from "../lib.ts"
import { publicProcedure, router } from "../trpc.ts"

export type CliRouter = typeof cliRouter
export const cliRouter = router({
	getUsers: publicProcedure.query(async () => {
		const users = db.employee.findMany()
		return users
	}),
	createUser: publicProcedure
		.input(
			z.object({
				name: z.string().min(3).max(100),
				email: z.email(),
				role: z.enum(Object.values(EmployeeRole)),
			})
		)
		.mutation(async (opts) => {
			const user = await db.employee.create({
				data: {
					name: opts.input.name,
					email: opts.input.email,
					role: opts.input.role,
					avatarUrl: getGravatarUrl(opts.input.email),
				},
			})
			return user
		}),
	getContent: publicProcedure.query(async () => {
		const content = db.content.findMany()
		return content
	}),
})
