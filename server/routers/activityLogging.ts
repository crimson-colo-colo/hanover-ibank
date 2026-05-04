import z from "zod"
import { db } from "../database.ts"
import { getDisplayName } from "../lib/content.ts"
import { adminProcedure, router } from "../trpc.ts"

export const activityLoggingRouter = router({
	listUserActivity: adminProcedure
		.input(z.object({ employeeId: z.string().optional(), limit: z.number().default(10) }))
		.query(async (opts) => {
			const activity = await db.activityLog.findMany({
				where: { employeeId: opts.input.employeeId },
				orderBy: { timestamp: "desc" },
				take: opts.input.limit,
			})

			const content = await db.content.findMany({
				where: {
					id: {
						in: activity.map((item) => item.contentId ?? ""),
					},
				},
				select: { title: true, id: true },
			})

			const contentMap = new Map(content.map((item) => [item.id, item.title]))
			const output = activity.map((item) => ({
				...item,
				displayName: getDisplayName(item.employeeId),
				contentTitle: item.contentId
					? (contentMap.get(item.contentId) ?? "")
					: (item.contentTitle ?? ""),
			}))
			return output
		}),
})
