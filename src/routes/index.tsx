import {createFileRoute} from "@tanstack/react-router"
import {HeaderSimple} from "@/components/navbar.tsx";

import {createTheme, MantineProvider} from "@mantine/core"

export const Route = createFileRoute("/")({
    component: App,
})


function App() {
    return (
        <main className="p-4">
            <p>
                Hello!
            </p>
        </main>
    )
}
