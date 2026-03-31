import { createRouter, RouterProvider } from "@tanstack/react-router"
import { createRoot } from "react-dom/client"
import { routeTree } from "./routeTree.gen.ts"

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	scrollRestoration: true,
})

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

const rootElement = document.getElementById("app")!

if (!rootElement.innerHTML) {
	const root = createRoot(rootElement)
	root.render(<RouterProvider router={router} />)
}
