import { AppShell, createTheme, MantineProvider } from "@mantine/core"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import "../styles.css"
import { DevSupport } from "@react-buddy/ide-toolbox"
import HeaderSimple from "@/components/navbar.tsx"
import { ComponentPreviews, useInitial } from "@/dev/index.ts"

export const Route = createRootRoute({
	component: RootComponent,
})
const theme = createTheme({
	primaryColor: "teal",
})

function RootComponent() {
	return (
		<MantineProvider theme={theme}>
			<DevSupport ComponentPreviews={ComponentPreviews} useInitialHook={useInitial}>
				<AppShell>
					<AppShell.Header>
						<HeaderSimple />
					</AppShell.Header>
					{/*<AppShell.Navbar>Navbar</AppShell.Navbar>*/}
					<AppShell.Main>
						<Outlet />
					</AppShell.Main>
				</AppShell>

				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "TanStack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
			</DevSupport>
		</MantineProvider>
	)
}
