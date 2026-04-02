import { TanStackDevtools } from "@tanstack/react-devtools"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import "../styles.css"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/trpc.ts"

export const Route = createRootRoute({
	component: RootComponent,
})

function RootComponent() {
	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "TanStack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					{
						name: "TanStack React Query",
						render: <ReactQueryDevtoolsPanel />,
					},
				]}
			/>
		</QueryClientProvider>
	)
}
