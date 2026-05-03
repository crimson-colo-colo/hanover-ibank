import z from "zod"
import { db } from "../database.ts"
import { adminProcedure, router } from "../trpc.ts"

export const activityLoggingRouter = router({
	listUserActivity: adminProcedure
		.input(z.object({ employeeId: z.string().optional() }))
		.query(async (opts) => {
			const activity = await db.activityLog.findMany({
				where: { employeeId: opts.input.employeeId },
				orderBy: { timestamp: "desc" },
				take: 100,
			})
			return activity
		}),
})
