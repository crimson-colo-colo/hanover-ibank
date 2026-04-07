import type { Auth0ContextInterface } from "@auth0/auth0-react"
import { QueryClient } from "@tanstack/react-query"
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import superjson from "superjson"
import { isDevelopment } from "@/env.ts"
import type { AppRouter } from "../../server/router.ts"

export const queryClient = new QueryClient({
	defaultOptions: {
		dehydrate: { serializeData: superjson.serialize },
		hydrate: { deserializeData: superjson.deserialize },
	},
})

// TODO: get auth0 context the right way instead of globally
let auth0: Auth0ContextInterface | null = null
export function setAuth0(a: Auth0ContextInterface) {
	auth0 = a
}

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		loggerLink({
			enabled: (opts) =>
				(isDevelopment && typeof window !== "undefined") ||
				(opts.direction === "down" && opts.result instanceof Error),
		}),
		httpBatchLink({
			url: "/trpc",
			transformer: superjson,
			headers: async () => {
				if (auth0?.isAuthenticated) {
					return {
						Authorization: `Bearer ${await auth0.getAccessTokenSilently()}`,
					}
				} else {
					return {}
				}
			},
		}),
	],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
})
