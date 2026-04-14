import z from "zod"
import { db } from "../database.ts"
import { EmployeeRole } from "../generated/prisma/enums.ts"
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
		.mutation(async (opts) => {}),
	getContent: publicProcedure.query(async () => {
		const content = db.content.findMany()
		return content
	}),
})
