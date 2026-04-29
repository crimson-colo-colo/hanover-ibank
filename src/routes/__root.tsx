import { type Auth0ContextInterface, type User, useAuth0 } from "@auth0/auth0-react"
import { AppShell, localStorageColorSchemeManager, MantineProvider, Text } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
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
import clsx from "clsx"
import Navigation from "@/components/Navigation.tsx"
import { ScrollToTopButton, useRouteScrollToTop } from "@/components/ScrollToTopButton.tsx"
import SideNavigation from "@/components/SideNavigation.tsx"
import { useInitial } from "@/dev/index.ts"
import { queryClient } from "@/lib/trpc.ts"
import { theme } from "@/theme.ts"
import "../styles.css"

interface RouterContext {
	auth0: Auth0ContextInterface<User>
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
	head: () => ({
		meta: [{ title: "iBank" }],
	}),
	errorComponent: ({ error, info }) => {
		const colorSchemeManager = localStorageColorSchemeManager({
			key: "mantine-color-scheme",
		})
		return (
			<MantineProvider theme={theme} colorSchemeManager={colorSchemeManager}>
				<Text>A pretty big error occurred.</Text>
				<Text>{error.name}</Text>
				<Text>{error.message}</Text>
				<Text>{error.stack}</Text>
				<Text>{info?.componentStack}</Text>
			</MantineProvider>
		)
	},
})

function RootComponent() {
	useRouteScrollToTop({ smooth: false })
	const location = useLocation()
	const isPreview = location.pathname.startsWith("/preview")
	const [collapsed, toggleCollapsed] = useLocalStorage({
		key: "side-nav-collapsed",
		defaultValue: false,
	})
	const auth0 = useAuth0()

	const colorSchemeManager = localStorageColorSchemeManager({
		key: "mantine-color-scheme",
	})

	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider theme={theme} colorSchemeManager={colorSchemeManager}>
				<DevSupport ComponentPreviews={() => null} useInitialHook={useInitial}>
					<AppShell
						layout="alt"
						padding={isPreview ? 0 : "md"}
						header={{ height: 56 }}
						navbar={{
							width: auth0.isAuthenticated && auth0.user ? (collapsed ? "50" : "260") : "0",
							breakpoint: "",
						}}
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
						<AppShell.Main className={clsx(!isPreview && "mx-auto")}>
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
