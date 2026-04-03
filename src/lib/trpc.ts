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

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		loggerLink({
			enabled: (opts) =>
				(isDevelopment && typeof window !== "undefined") ||
				(opts.direction === "down" && opts.result instanceof Error),
		}),
		httpBatchLink({ url: "/trpc", transformer: superjson }),
	],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
})
