import { createFileRoute } from "@tanstack/react-router"
import Navbar, {HeaderSimple} from "@/components/navbar.tsx";

import { MantineProvider, createTheme } from "@mantine/core"

export const Route = createFileRoute("/")({
	component: App,
})

let theme = createTheme({})

function App() {
	return (
		<main className="p-4">
			<MantineProvider theme={theme}>
				<HeaderSimple/>
			</MantineProvider>
		</main>
	)
}
