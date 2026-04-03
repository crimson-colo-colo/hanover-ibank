import { db } from "./database.ts"
import { cliRouter } from "./routers/cli.ts"
import { storageRouter } from "./s3.ts"
import { publicProcedure, router } from "./trpc.ts"

export type AppRouter = typeof appRouter
export const appRouter = router({
	s3: storageRouter,
	cli: cliRouter,
	listContent: publicProcedure.query(async () => {
		const data = await db.content.findMany()
		return data
	}),
})
