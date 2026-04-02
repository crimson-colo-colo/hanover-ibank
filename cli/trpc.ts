import { createTRPCClient, httpBatchLink } from "@trpc/client"
import superjson from "superjson"
import type { AppRouter } from "../server/router.ts"
import { env } from "./env.ts"

export const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${env.API_URL}/trpc`,
			transformer: superjson,
		}),
	],
})
