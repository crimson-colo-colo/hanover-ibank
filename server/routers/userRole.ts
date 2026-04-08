import { db } from "../database.ts"
import { authProcedure, router } from "../trpc.ts"

export const userRoleRouter = router({
	role: authProcedure.query(async (opts) => {
		const user = await db.employee.findUnique({
			where: {
				id: opts.ctx.auth.sub,
			},
		})
		return user?.role
	}),
})
