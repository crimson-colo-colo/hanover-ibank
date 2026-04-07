import { Auth0Provider, useAuth0 } from "@auth0/auth0-react"
import { RouterProvider } from "@tanstack/react-router"
import { createRoot } from "react-dom/client"
import { authOptions } from "@/lib/auth.ts"
import { getRouter } from "@/router.tsx"

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

const router = getRouter()

function App() {
	const auth0 = useAuth0()
	return <RouterProvider router={router} context={{ auth0 }} />
}

const rootElement = document.getElementById("app")!
if (!rootElement.innerHTML) {
	const root = createRoot(rootElement)
	root.render(
		<Auth0Provider {...authOptions}>
			<App />
		</Auth0Provider>
	)
}
