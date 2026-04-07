import { Auth0Provider, useAuth0 } from "@auth0/auth0-react"
import { IconLoader2 } from "@tabler/icons-react"
import { RouterProvider } from "@tanstack/react-router"
import { useEffect } from "react"
import { createRoot } from "react-dom/client"
import { authOptions } from "@/lib/auth.ts"
import { setAuth0 } from "@/lib/trpc.ts"
import { getRouter } from "@/router.tsx"

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

const router = getRouter()

function App() {
	const auth0 = useAuth0()

	useEffect(() => {
		setAuth0(auth0)
	}, [auth0])

	if (auth0.isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<IconLoader2 className="animate-spin" />
			</div>
		)
	}

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
