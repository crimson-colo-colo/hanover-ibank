import { RouterProvider } from "@tanstack/react-router"
import { createRoot } from "react-dom/client"
import { getRouter } from "@/router.tsx"

const router = getRouter()

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
