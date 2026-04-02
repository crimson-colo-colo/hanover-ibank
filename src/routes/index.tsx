import {createFileRoute} from "@tanstack/react-router"

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

export default App