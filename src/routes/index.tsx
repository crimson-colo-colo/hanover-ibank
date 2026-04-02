import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
	component: App,
})

function App() {
	return (
		<main className="p-4">
			<p className="wrap-break-word">
				Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello!
				Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello!
				Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello!
				Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! foo
			</p>
		</main>
	)
}

export default App // this line is needed for the react buddy plugin previews. I
// don't know why.
