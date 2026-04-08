import type { Auth0ContextInterface, User } from "@auth0/auth0-react"
import { AppShell, createTheme, MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { DevSupport } from "@react-buddy/ide-toolbox"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import tailwindcss from "tailwindcss/defaultTheme"
import Navigation from "@/components/Navigation.tsx"
import { ScrollToTopButton, useRouteScrollToTop } from "@/components/ScrollToTopButton.tsx"
import { ComponentPreviews, useInitial } from "@/dev/index.ts"
import { queryClient } from "@/lib/trpc.ts"

import "../styles.css"

interface RouterContext {
	auth0: Auth0ContextInterface<User>
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
})
const theme = createTheme({
	primaryColor: "teal",
	breakpoints: {
		sm: tailwindcss.screens.sm,
		md: tailwindcss.screens.md,
		lg: tailwindcss.screens.lg,
		xl: tailwindcss.screens.xl,
	},
})

function RootComponent() {
	useRouteScrollToTop({ smooth: false })

	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider theme={theme}>
				<DevSupport ComponentPreviews={ComponentPreviews} useInitialHook={useInitial}>
					<AppShell padding="md" header={{ height: 56 }}>
						<AppShell.Header>
							<Navigation />
						</AppShell.Header>
						{/*<AppShell.Navbar>Navbar</AppShell.Navbar>*/}
						<AppShell.Main className="max-w-240 mx-auto">
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
