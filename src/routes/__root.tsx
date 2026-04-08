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
import { queryClient } from "@/lib/trpc.ts"

import "../styles.css"
import { useInitial } from "@/dev/index.ts"

interface RouterContext {
	auth0: Auth0ContextInterface<User>
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
})
const theme = createTheme({
	primaryColor: "Fuchsia",
	primaryShade: { light: 6, dark: 8 },
	colors: {
		Red: [
			"#ffecea",
			"#ffdbd8",
			"#ffbeba",
			"#ffa09c",
			"#fd8d89",
			"#f87977",
			"#d06563",
			"#a64f4d",
			"#763736",
			"#4c2020",
			"#2f1211",
		],
		Orange: [
			"#fceee3",
			"#fbdfc9",
			"#f7c59e",
			"#f2aa6f",
			"#ef994f",
			"#e98727",
			"#c47120",
			"#9c5917",
			"#6f3e0f",
			"#472505",
			"#2c1502",
		],

		Yellow: [
			"#f4f0e0",
			"#ebe4c4",
			"#dccf94",
			"#ceba5f",
			"#c5ac34",
			"#bb9e00",
			"#9d8400",
			"#7c6800",
			"#584a00",
			"#372d00",
			"#221b00",
		],
		Pear: [
			"#eef2e2",
			"#e0e7c8",
			"#c9d49a",
			"#b3c16a",
			"#a5b647",
			"#98a914",
			"#7f8e11",
			"#64700a",
			"#464f07",
			"#2b3102",
			"#191d01",
		],
		Lime: [
			"#e9f3e5",
			"#d6e9ce",
			"#b6d8a6",
			"#95c77d",
			"#81bd63",
			"#6cb147",
			"#5a943b",
			"#46752d",
			"#31531e",
			"#1c340f",
			"#0f1f07",
		],
		Emerald: [
			"#e3f4eb",
			"#caebda",
			"#9cdcbd",
			"#69cca1",
			"#3ec28f",
			"#00b77e",
			"#009969",
			"#007952",
			"#005639",
			"#003522",
			"#002013",
		],

		Cyan: [
			"#dff4f3",
			"#c3ebea",
			"#8ddcda",
			"#46cccb",
			"#00c2c1",
			"#00b5b5",
			"#009898",
			"#007878",
			"#005555",
			"#003535",
			"#001f1f",
		],
		Sky: [
			"#e2f3fc",
			"#c7e8fa",
			"#98d7f6",
			"#62c5f3",
			"#30b9f1",
			"#00aceb",
			"#0090c5",
			"#00729d",
			"#005070",
			"#003247",
			"#001e2c",
		],
		Blue: [
			"#e9f0ff",
			"#d7e4ff",
			"#b7ceff",
			"#98b9ff",
			"#86abff",
			"#739cff",
			"#6083d9",
			"#4b67ad",
			"#34497c",
			"#1f2d50",
			"#111a32",
		],

		Iris: [
			"#eeefff",
			"#e1e1ff",
			"#cac9ff",
			"#b4b2ff",
			"#a8a3ff",
			"#9b93ff",
			"#817bd7",
			"#6661ac",
			"#48447b",
			"#2c294f",
			"#1a1832",
		],
		Violet: [
			"#f4edfd",
			"#ebdffc",
			"#dbc5fb",
			"#cdabf9",
			"#c49af8",
			"#ba8af4",
			"#9c73cc",
			"#7c5aa3",
			"#583f74",
			"#37264b",
			"#21162f",
		],
		Fuchsia: [
			"#f8ecfa",
			"#f3dcf6",
			"#ebc1ef",
			"#e2a5e9",
			"#dc93e4",
			"#d381de",
			"#b16cba",
			"#8d5594",
			"#643b69",
			"#402343",
			"#27142a",
		],
		Byzantium: [
			"#fcecf5",
			"#fadbed",
			"#f6bee0",
			"#f1a1d3",
			"#ed8ecb",
			"#e77bc1",
			"#c267a2",
			"#9a5081",
			"#6e385b",
			"#462139",
			"#2c1323",
		],
	},

	fontFamily: '"Miranda Sans", system-ui, sans-serif',

	defaultRadius: "md",

	respectReducedMotion: true,
	cursorType: "default",

	autoContrast: true,
	luminanceThreshold: 0.3,
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
