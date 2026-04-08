import { Button, Text, Title } from "@mantine/core"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import office from "@/assets/office.png"

export const Route = createFileRoute("/")({
	component: Index,
	beforeLoad: (opts) => {
		const { auth0 } = opts.context
		if (auth0.isAuthenticated) {
			throw redirect({
				to: "/dashboard",
			})
		}
	},
})

function Index() {
	const { auth0 } = Route.useRouteContext()

	return (
		<main>
			<header
				className="mt-4 w-full h-100 bg-cover bg-center rounded-xl relative px-12 py-12 z-0 text-white flex flex-col justify-center"
				style={{ backgroundImage: `url(${office})` }}
			>
				<div className="absolute inset-0 bg-linear-to-r from-primary to-transparent to-80% rounded-xl -z-2"></div>
				<div className="absolute inset-0 bg-black/60 rounded-xl -z-1 backdrop-blur-xs"></div>
				<Title mb="lg">Welcome to Hanover CMS!</Title>
				<Text size="lg">
					Innovative content management for insurance professionals. Streamline your workflow,
					enhance collaboration, and access your resources anytime, anywhere. Experience the future
					of content management with Hanover CMS.
				</Text>

				<div className="mb-2 flex gap-4 mt-12">
					{auth0.isAuthenticated ? (
						<Button component={Link} to="/dashboard">
							Dashboard
						</Button>
					) : (
						<Button onClick={() => auth0.loginWithRedirect()} size="md">
							Login to Get Started
						</Button>
					)}
				</div>
			</header>

			<section className="mt-10">
				<Title order={2} mb="md">
					About Hanover CMS
				</Title>
				<Text>
					Hanover CMS is a cutting-edge content management system designed specifically for
					insurance professionals. Whether you're a business analyst looking to organize and analyze
					data or an underwriter needing quick access to resources, Hanover CMS has you covered.
					With its intuitive interface and powerful features, managing your content has never been
					easier.
				</Text>
			</section>
		</main>
	)
}
