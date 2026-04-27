import { type Auth0ContextInterface, type User, useAuth0 } from "@auth0/auth0-react"
import { AppShell, localStorageColorSchemeManager, MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { DevSupport } from "@react-buddy/ide-toolbox"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	useLocation,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import Navigation from "@/components/Navigation.tsx"
import { ScrollToTopButton, useRouteScrollToTop } from "@/components/ScrollToTopButton.tsx"
import SideNavigation from "@/components/SideNavigation.tsx"
import { useInitial } from "@/dev/index.ts"
import { queryClient } from "@/lib/trpc.ts"
import { theme } from "@/theme.ts"
import "../styles.css"
import clsx from "clsx"
import { useState } from "react"

interface RouterContext {
	auth0: Auth0ContextInterface<User>
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
	head: () => ({
		meta: [{ title: "iBank" }],
	}),
})

function RootComponent() {
	useRouteScrollToTop({ smooth: false })
	const location = useLocation()
	const isPreview = location.pathname.startsWith("/preview")
	const [collapsed, toggleCollapsed] = useState(false)
	const auth0 = useAuth0()

	const colorSchemeManager = localStorageColorSchemeManager({
		key: "mantine-color-scheme",
	})

	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider theme={theme} colorSchemeManager={colorSchemeManager}>
				<DevSupport ComponentPreviews={() => null} useInitialHook={useInitial}>
					<AppShell
						padding={isPreview ? 0 : "md"}
						header={{ height: 56 }}
						navbar={{
							width: auth0.isAuthenticated && auth0.user ? (collapsed ? "70" : "260") : "0",
							breakpoint: "sm",
						}}
						//transitionDuration={1000}
						//transitionTimingFunction="ease"
						className={clsx(isPreview && "not-dark:bg-gray-100")}
					>
						<AppShell.Header>
							<Navigation />
						</AppShell.Header>
						{auth0.isAuthenticated && auth0.user && (
							<AppShell.Navbar>
								<SideNavigation
									collapsed={collapsed}
									toggleCollapsed={() => toggleCollapsed((c) => !c)}
								/>
							</AppShell.Navbar>
						)}
						<AppShell.Main className={clsx(!isPreview && "mx-auto max-w-325")}>
							<HeadContent />
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
