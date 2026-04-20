import type { ActivityGraph } from "@shared/ActivityGraphInterface.ts"
import { db } from "../database.ts"
import { adminProcedure, router } from "../trpc.ts"

export const userActivityRouter = router({
	viewUserActivityHeatmap: adminProcedure.query(async () => {
		const groupUsers = await db.userActivity.groupBy({
			by: ["day", "employeeId"],
			orderBy: { day: "asc" },
			// we don't need the sum but i think it will complain if we don't use it.
			_sum: { count: true },
		})

		const users: number[] = []
		let currentUsers: string[] = []
		let currentDay = null
		for (const entry of groupUsers) {
			if (currentDay === null) {
				currentDay = entry.day
			}
			if (currentDay.toDateString() !== entry.day.toDateString()) {
				currentDay = entry.day
				users.push(currentUsers.length)
				currentUsers = []
			}
			if (!currentUsers.includes(entry.employeeId)) {
				currentUsers.push(entry.employeeId)
			}
		}

		if (currentUsers.length !== 0) users.push(currentUsers.length)

		return users satisfies ActivityGraph
	}),
})
