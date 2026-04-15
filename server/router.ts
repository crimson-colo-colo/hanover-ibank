import { adminRouter } from "./routers/admin.ts"
import { cliRouter } from "./routers/cli.ts"
import { contentRouter } from "./routers/content.ts"
import { formsRouter } from "./routers/forms.ts"
import { previewRouter } from "./routers/preview.ts"
import { userRouter } from "./routers/user.ts"
import { router } from "./trpc.ts"
import {opengraphRouter} from "./routers/linkPreview.ts";

export type AppRouter = typeof appRouter
export const appRouter = router({
	cli: cliRouter,
	content: contentRouter,
	forms: formsRouter,
	admin: adminRouter,
	user: userRouter,
	preview: previewRouter,
	opengraph: opengraphRouter,
})
