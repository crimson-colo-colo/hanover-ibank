import { Burger, Button, Container, Divider, Drawer, Group, ScrollArea } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconBuildingBank } from "@tabler/icons-react"
import { Link, useLocation } from "@tanstack/react-router"

const links = [
	{ link: "/analyst", label: "Analyst Home" },
	{ link: "/underwriter", label: "Underwriter Home" },
	{ link: "/upload-content", label: "Upload Form" },
	{ link: "/employee", label: "Employee Management" },
]

export function HeaderSimple() {
	const [opened, { toggle, close }] = useDisclosure(false)
	const location = useLocation({ structuralSharing: true })
	const items = links.map((link) => (
		<Button
			component={Link}
			variant={location.pathname === link.link ? "light" : "subtle"}
			key={link.label}
			to={link.link}
		>
			{link.label}
		</Button>
	))

	return (
		<header className="h-14 mb-30 bg-bg border-b border-border">
			<Container size="md" className="h-full flex justify-between items-center">
				<Group gap={5} visibleFrom="xs">
					<Link to="/" className="mr-4 gap-2 flex items-center no-underline">
						<IconBuildingBank className="text-primary-hover" />
						<span className="font-semibold text-lg text-primary-hover">Hanover CMS</span>
					</Link>
					{items}
				</Group>

				<Burger
					opened={opened}
					onClick={toggle}
					hiddenFrom="xs"
					size="sm"
					aria-label="Toggle navigation"
				/>
			</Container>

			<Drawer
				opened={opened}
				onClose={close}
				size="100%"
				padding="md"
				title="Navigation"
				hiddenFrom="xs"
				zIndex={1000000}
			>
				<ScrollArea h="calc(100vh - 56px)" mx="-md">
					<Divider my="sm" />
					{items}
				</ScrollArea>
			</Drawer>
		</header>
	)
}
export default HeaderSimple
