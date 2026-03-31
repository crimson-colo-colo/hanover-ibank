import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
	component: App,
})

function App() {
	return (
		<main className="p-4">
			<h1 className="text-xl font-semibold">Hello, world</h1>
			<span className="text-sm text-gray-500">
				This is an empty Tanstack Router + React + Vite + Tailwind CSS project.
			</span>
		</main>
	)
}
