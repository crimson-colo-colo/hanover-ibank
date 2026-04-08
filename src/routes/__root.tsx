import type { Auth0ContextInterface, User } from "@auth0/auth0-react"
import { AppShell, MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { DevSupport } from "@react-buddy/ide-toolbox"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import Navigation from "@/components/Navigation.tsx"
import { ScrollToTopButton, useRouteScrollToTop } from "@/components/ScrollToTopButton.tsx"
import { useInitial } from "@/dev/index.ts"
import { queryClient } from "@/lib/trpc.ts"
import { theme } from "@/theme.ts"

import "../styles.css"

interface RouterContext {
	auth0: Auth0ContextInterface<User>
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
})

function RootComponent() {
	useRouteScrollToTop({ smooth: false })

	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider theme={theme}>
				<DevSupport ComponentPreviews={() => null} useInitialHook={useInitial}>
					<AppShell padding="md" header={{ height: 56 }}>
						<AppShell.Header>
							<Navigation />
						</AppShell.Header>
						{/*<AppShell.Navbar>Navbar</AppShell.Navbar>*/}
						<AppShell.Main className="max-w-280 mx-auto">
							<Outlet />
						</AppShell.Main>
					</AppShell>
					<Notifications />
					<ScrollToTopButton threshold={50} />
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
				</DevSupport>
			</MantineProvider>
		</QueryClientProvider>
	)
}
