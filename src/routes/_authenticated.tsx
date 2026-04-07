import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated")({
	component: RouteComponent,
	beforeLoad: (ctx) => {
		const { auth0 } = ctx.context
		if (!auth0.isAuthenticated) {
			throw redirect({
				to: "/",
			})
		}
	},
})

function RouteComponent() {
	return <Outlet />
}
