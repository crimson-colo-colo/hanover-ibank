import z from "zod"
import { publicProcedure, router } from "./trpc.ts"

export type AppRouter = typeof appRouter
export const appRouter = router({
	getUser: publicProcedure.input(z.string()).query((opts) => {
		return { id: opts.input, name: "Bilbo" }
	}),
	createUser: publicProcedure
		.input(z.object({ name: z.string().min(5) }))
		.mutation(async (opts) => {
			return { id: "1", ...opts.input }
		}),
})
