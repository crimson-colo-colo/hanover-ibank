import { Burger, Container, Divider, Drawer, Group, ScrollArea } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useLocation } from "@tanstack/react-router"

import "./navbar.css"

const links = [
	{ link: "/", label: "Home" },
	{ link: "/upload-content", label: "Upload Form" },
	{ link: "/manage-employees", label: "Employee Management" },
	{ link: "/underwriter", label: "Underwriter" },
	{ link: "/analyst", label: "Business Analyst" },
]

export function HeaderSimple() {
	const [opened, { toggle, close }] = useDisclosure(false)
	const location = useLocation({ structuralSharing: true })
	const items = links.map((link) => (
		<a
			key={link.label}
			href={link.link}
			className={"link"}
			data-active={location.pathname === link.link || undefined}
		>
			{link.label}
		</a>
	))

	return (
		<header className={"header"}>
			<Container size="md" className={"inner"}>
				<Group gap={5} visibleFrom="xs">
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
				<ScrollArea h="calc(100vh - 80px)" mx="-md">
					<Divider my="sm" />
					{items}
				</ScrollArea>
			</Drawer>
		</header>
	)
}
export default HeaderSimple
