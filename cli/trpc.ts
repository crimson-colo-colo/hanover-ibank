import { createTRPCClient, httpLink } from "@trpc/client"
import superjson from "superjson"
import type { AppRouter } from "../server/router.ts"
import { env } from "./env.ts"

export const trpc = createTRPCClient<AppRouter>({
	links: [
		httpLink({
			url: `${env.API_URL}/trpc`,
			headers: {
				"x-cli-token": env.CLI_TOKEN,
			},
			transformer: superjson,
		}),
	],
})
