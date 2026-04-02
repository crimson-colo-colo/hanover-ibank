import { createFileRoute } from "@tanstack/react-router"
import { ContentDatesForm } from "@/components/content-dates-form.tsx"
import { MantineProvider } from '@mantine/core'

export const Route = createFileRoute("/")({
	component: App,
})

function App() {
	return (
		<MantineProvider>
		<main className="p-4">
			<h1 className="text-xl font-semibold">Hello, world</h1>
			<span className="text-sm text-gray-500">
				This is an empty Tanstack Router + React + Vite + Tailwind CSS project.
			</span>
			<ContentDatesForm
				onSubmit={(values) => {
					console.log(values)
				}}
			/>
		</main>
		</MantineProvider>
	)
}
