import ogs from "open-graph-scraper"
import z from "zod"
import { db } from "../database.ts"
import { authProcedure, router } from "../trpc.ts"

export const opengraphRouter = router({
	getOpenGraph: authProcedure
		.input(z.object({ url: z.url(), id: z.string() }))
		.query(async (opts) => {
			const url = opts.input.url

			try {
				const { error, result } = await ogs({ url: url })

				await db.recentTimestamps.upsert({
					where: {
						employeeId_contentId: {
							contentId: opts.input.id,
							employeeId: opts.ctx.auth.sub,
						},
					},
					create: {
						recentlyViewed: new Date(),
						viewCount: 1,
						contentId: opts.input.id,
						recentlyEdited: new Date(),
						employeeId: opts.ctx.auth.sub,
					},
					update: {
						recentlyViewed: new Date(),
						viewCount: { increment: 1 },
					},
				})

				if (!error) {
					return { response: result }
				} else {
					return { response: null }
				}
			} catch (e) {
				console.error("Error fetching Open Graph data:", e)
				return { response: null }
			}
		}),
})
