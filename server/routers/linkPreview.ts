import ogs from "open-graph-scraper"
import z from "zod"
import { authProcedure, router } from "../trpc.ts"

export const opengraphRouter = router({
	getGraphResponse: authProcedure.input(z.object({ url: z.url() })).query(async (opts) => {
		const url = opts.input.url

		const { error, html, result, response } = await ogs({ url: url })

		if (!error) {
			return { response: result }
		} else {
			return { response: null }
		}
	}),
})
