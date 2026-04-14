import { Alert, Button, Text, Title } from "@mantine/core"
import { IconInfoCircleFilled } from "@tabler/icons-react"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { useState } from "react"
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
	const icon = <IconInfoCircleFilled className="fill-sky-600" size={50} />
	const [visible, setVisible] = useState(true)

	return (
		<main>
			{visible && (
				<Alert
					variant="light"
					color="sky"
					title="Info"
					icon={icon}
					styles={{ icon: { width: 50, height: 50 }, title: { fontSize: "24px" } }}
					withCloseButton
					onClose={() => setVisible(false)}
				>
					This website has been created for <strong> WPI's CS 3733 Software Engineering </strong> as
					a class project and is <strong>NOT</strong> in use by Hanover Insurance.
				</Alert>
			)}
			<header
				className="mt-4 w-full h-100 bg-cover bg-center rounded-xl relative px-12 py-12 z-0 text-white flex flex-col justify-center"
				style={{ backgroundImage: `url(${office})` }}
			>
				<div className="absolute inset-0 bg-linear-to-r from-primary to-transparent to-80% rounded-xl -z-2"></div>
				<div className="absolute inset-0 bg-black/60 rounded-xl -z-1 backdrop-blur-xs"></div>
				<Title mb="lg">Welcome to iBank!</Title>
				<Text size="lg">
					Innovative content management for insurance professionals. Streamline your workflow,
					enhance collaboration, and access your resources anytime, anywhere. Experience the future
					of content management with iBank.
				</Text>

				<div className="mb-2 flex gap-4 mt-12">
					{auth0.isAuthenticated ? (
						<Button component={Link} to="/dashboard">
							Dashboard
						</Button>
					) : (
						<Button onClick={() => auth0.loginWithRedirect()} size="md">
							Get Started
						</Button>
					)}
				</div>
			</header>

			<section className="mt-10">
				<Title order={2} mb="md">
					About iBank
				</Title>
				<Text c="gray">
					iBank is a cutting-edge content management system designed specifically for insurance
					professionals. Whether you're a business analyst looking to organize and analyze data or
					an underwriter needing quick access to resources, iBank has you covered. With its
					intuitive interface and powerful features, managing your content has never been easier.
				</Text>
				<Text c="gray" mt="md">
					Our platform offers seamless integration with your existing tools, robust security
					measures to protect your sensitive information, and a collaborative environment that
					fosters teamwork and efficiency. Join the iBank community today and revolutionize the way
					you manage your content!
				</Text>
			</section>
		</main>
	)
}
