import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { ScrollToTopButton } from "@/components/scroll-to-top-button.tsx";
import { RouterScrollToTop } from "@/components/router-scroll-to-top.tsx";
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import { MantineProvider } from '@mantine/core'

import "../styles.css"

export const Route = createRootRoute({
	component: RootComponent,
})

function RootComponent() {
	return (
		<MantineProvider>
		<>
			<Outlet />
			<TanStackDevtools
				config={{
					position: "bottom-left",
				}}
				plugins={[
					{
						name: "TanStack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
				]}
			/>
			<RouterScrollToTop />
			<ScrollToTopButton threshold={50} />
		</>
		</MantineProvider>
	)
}
