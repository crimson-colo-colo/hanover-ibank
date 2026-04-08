import crypto from "node:crypto"
import { TRPCError } from "@trpc/server"
import z from "zod"
import { auth0Management } from "../auth.ts"
import { db } from "../database.ts"
import { EmployeeRole } from "../generated/prisma/client.ts"
import { adminProcedure, authProcedure, router } from "../trpc.ts"

export const adminRouter = router({
	isAdmin: authProcedure.query(async (opts) => {
		const user = await db.employee.findUnique({
			where: {
				id: opts.ctx.auth.sub,
			},
		})
		return user?.role === EmployeeRole.Admin
	}),
	listUsers: adminProcedure.query(async () => {
		const users = await db.employee.findMany()
		const auth0Users = await auth0Management.users.list()

		return users.flatMap((user) => {
			const auth0User = auth0Users.data.find((u) => u.user_id === user.id)
			if (!auth0User) {
				return []
			}
			return {
				id: user.id,
				name: auth0User.name ?? auth0User.nickname ?? auth0User.username!,
				email: auth0User.email!,
				username: auth0User.username!,
				role: user.role,
				avatarUrl: auth0User.picture ?? getAvatarUrl(auth0User.email!),
			}
		})
	}),
	updateUser: adminProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(3).max(100),
				email: z.email(),
				username: z.string().min(3).max(100),
				role: z.enum(Object.values(EmployeeRole)),
			})
		)
		.mutation(async (opts) => {
			const user = await db.employee.findUnique({
				where: {
					id: opts.input.id,
				},
			})

			if (!user) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			await auth0Management.users.update(opts.input.id, {
				name: opts.input.name,
				email: opts.input.email,
			})

			await auth0Management.users.update(opts.input.id, {
				username: opts.input.username,
			})

			await db.employee.update({
				where: {
					id: opts.input.id,
				},
				data: {
					role: opts.input.role,
				},
			})
		}),

	createUser: adminProcedure
		.input(
			z.object({
				name: z.string().min(3).max(100),
				email: z.email(),
				username: z.string().min(3).max(100),
				role: z.enum(Object.values(EmployeeRole)),
				password: z.string().max(100),
			})
		)
		.mutation(async (opts) => {
			const auth0User = await auth0Management.users.create({
				name: opts.input.name,
				email: opts.input.email,
				username: opts.input.username,
				password: opts.input.password,
				connection: "Username-Password-Authentication",
			})

			await db.employee.create({
				data: {
					id: auth0User.user_id!,
					role: opts.input.role,
				},
			})
		}),

	deleteUsers: adminProcedure.input(z.array(z.string())).mutation(async (opts) => {
		await Promise.all(
			opts.input.map(async (id) => {
				await auth0Management.users.delete(id)
				await db.employee.delete({ where: { id } })
			})
		)
	}),
})
function getAvatarUrl(email: string) {
	const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex")
	return `https://www.gravatar.com/avatar/${hash}?d=identicon`
}
