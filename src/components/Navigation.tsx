import { useAuth0 } from "@auth0/auth0-react"
import {
	Burger,
	Button,
	Container,
	Divider,
	Drawer,
	Group,
	Image,
	Menu,
	ScrollArea,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconBuildingBank, IconLayoutSidebarLeftExpand } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

const links = [
	{ link: "/analyst", label: "Analyst Home" },
	{ link: "/underwriter", label: "Underwriter Home" },
	{ link: "/upload-content", label: "Upload Form" },
	{ link: "/employee", label: "Employee Management" },
]

export function Navigation() {
	const auth0 = useAuth0()
	const [opened, { toggle, close }] = useDisclosure(false)
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
					{auth0.isAuthenticated && items}
				</Group>

				<Group>
					{auth0.isAuthenticated && auth0.user ? (
						<Menu trigger="click" position="bottom-end">
							<Menu.Target>
								<Image
									h={40}
									bdrs="100%"
									className="cursor-pointer"
									src={auth0.user.picture}
									alt={auth0.user.name}
								/>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item
									leftSection={<IconLayoutSidebarLeftExpand />}
									onClick={() => auth0.logout()}
									color="red"
								>
									Sign Out
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					) : (
						<Button onClick={() => auth0.loginWithRedirect()}>Login</Button>
					)}
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
export default Navigation
