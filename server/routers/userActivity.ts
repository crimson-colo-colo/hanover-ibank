import { UTCDate } from "@date-fns/utc"
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
			const dateKey = new UTCDate(entry.day).toISOString().slice(0, 10)
			if (!dayMap.has(dateKey)) dayMap.set(dateKey, new Set())
			dayMap.get(dateKey)!.add(entry.employeeId)
		}

		return Object.fromEntries([...dayMap.entries()].map(([date, users]) => [date, users.size]))
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
				],
			},
			include: {
				employee: true,
			},
		})

		const results = await Promise.all(
			recent.map(async (a) => {
				let contentTitle: string | null = null
				if (a.path === "forms.createContent") {
					const recentContent = await db.content.findFirst({
						where: {
							ownerId: a.employeeId,
							createdAt: {
								gte: new Date(a.timestamp.getTime() - 60000),
								lte: new Date(a.timestamp.getTime() + 60000),
							},
						},
						orderBy: { createdAt: "desc" },
						select: { title: true },
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
			})
		)

		const deduplicated = results.filter((entry, i) => {
			if (i === 0) return true
			return entry.path !== results[i - 1].path
		})

		return deduplicated.slice(0, 10)
	}),
})
