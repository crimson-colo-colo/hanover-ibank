import { adminRouter } from "./routers/admin.ts"
import { cliRouter } from "./routers/cli.ts"
import { contentRouter } from "./routers/content.ts"
import { formsRouter } from "./routers/forms.ts"
import { storageRouter } from "./s3.ts"
import { router } from "./trpc.ts"

export type AppRouter = typeof appRouter
export const appRouter = router({
	s3: storageRouter,
	cli: cliRouter,
	content: contentRouter,
	forms: formsRouter,
	admin: adminRouter,
})
