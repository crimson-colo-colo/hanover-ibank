import ogs from "open-graph-scraper"
import z from "zod"
import { authProcedure, router } from "../trpc.ts"
import {db} from "../database.ts";

export const opengraphRouter = router({
	getOpenGraph: authProcedure.input(z.object({ url: z.url(), id: z.string() })).query(async (opts) => {
		const url = opts.input.url

		const { error, result } = await ogs({ url: url })

		await db.recentTimestamps.update({
			where: {
				employeeId_contentId: {
					contentId: opts.input.id,
					employeeId: opts.ctx.auth.sub,
				},
			},
			data: {
				recentlyViewed: new Date(),
			},
		})

		if (!error) {
			return { response: result }
		} else {
			return { response: null }
		}
	}),
})
