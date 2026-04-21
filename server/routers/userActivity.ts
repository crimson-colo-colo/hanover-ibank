import type { ActivityGraph } from "@shared/ActivityGraphInterface.ts"
import { db } from "../database.ts"
import { adminProcedure, router } from "../trpc.ts"

export const userActivityRouter = router({

	viewActivityHeatmapWithDates: adminProcedure.query(async () => {
		const groupUsers = await db.userActivity.groupBy({
			by: ["day", "employeeId"],
			orderBy: { day: "asc" },
			_sum: { count: true },
		})

		const dayMap = new Map<string, Set<string>>()
		for (const entry of groupUsers) {
			const dateKey = entry.day.toISOString().slice(0, 10)
			if (!dayMap.has(dateKey)) dayMap.set(dateKey, new Set())
			dayMap.get(dateKey)!.add(entry.employeeId)
		}

		return Object.fromEntries(
			[...dayMap.entries()].map(([date, users]) => [date, users.size])
		)
	}),

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

	viewRecentActivity: adminProcedure.query(async () => {
		const recent = await db.userActivity.findMany({
			orderBy: { timestamp: "desc" },
			take: 20,
			where: {
				NOT: [
					{ path: { contains: "userActivity" } },
					{ path: { contains: "getUploadStats" } },
					{ path: { contains: "getFileStats" } },
					{ path: { contains: "avatar" } },
					{ path: { contains: "getAvatarUrl" } },
					{ path: { contains: "getStats" } },
					{ path: { contains: "preview" } },
					{ path: { contains: "getProfile" } },
				]
			},
			include: {
				employee: true,
			},
		})

		const results = await Promise.all(recent.map(async (a) => {
			let contentTitle: string | null = null
			if (a.path === "forms.createContent") {
				const recentContent = await db.content.findFirst({
					where: {
						ownerId: a.employeeId,
						createdAt: {
							gte: new Date(a.timestamp.getTime() - 60000),
							lte: new Date(a.timestamp.getTime() + 60000),
						}
					},
					orderBy: { createdAt: "desc" },
					select: { title: true }
				})
				contentTitle = recentContent?.title ?? null
			}
			return {
				employeeId: a.employeeId,
				path: a.path,
				timestamp: a.timestamp,
				count: a.count,
				contentTitle,
			}
		}))

		const deduplicated = results.filter((entry, i) => {
			if (i === 0) return true
			return entry.path !== results[i - 1].path
		})

		return deduplicated.slice(0, 10)
	}),

})
