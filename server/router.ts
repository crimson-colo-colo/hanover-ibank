import { storageRouter } from "./s3.ts"
import { router } from "./trpc.ts"
import { documentRouter} from "./document.ts";

export type AppRouter = typeof appRouter
export const appRouter = router({
	s3: storageRouter,
  document: documentRouter,
})
