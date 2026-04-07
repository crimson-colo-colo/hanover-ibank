import { cliRouter } from "./routers/cli.ts"
import { contentRouter } from "./routers/content.ts"
import { storageRouter } from "./s3.ts"
import { authProcedure, router } from "./trpc.ts"

export type AppRouter = typeof appRouter
export const appRouter = router({
	s3: storageRouter,
	cli: cliRouter,
	content: contentRouter,
})
