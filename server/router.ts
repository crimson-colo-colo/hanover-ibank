import { storageRouter } from "./s3.ts"
import { publicProcedure, router } from "./trpc.ts"
import { db } from "./database.ts";

export type AppRouter = typeof appRouter
export const appRouter = router({
	s3: storageRouter,

	listContent: publicProcedure
		.query(async () => {
			const data = await db.content.findMany();
			return data
		})
})
