import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { trpcClient } from "@/lib/trpc.ts"

export const Route = createFileRoute("/admin")({
	component: RouteComponent,
	beforeLoad: async (ctx) => {
		const isAdmin = await trpcClient.admin.isAdmin.query()
		if (!isAdmin) {
			throw redirect({
				to: "/",
			})
		}
	},
})

function RouteComponent() {
	return <Outlet />
}
