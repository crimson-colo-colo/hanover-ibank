import { useAuth0 } from "@auth0/auth0-react"
import {
	ActionIcon,
	Burger,
	Button,
	Code,
	Container,
	Drawer,
	Group,
	Indicator,
	Menu,
	NavLink,
	Text,
	TextInput,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
	IconBell,
	IconBolt,
	IconBuildingBank,
	IconChevronRight,
	IconInfoCircle,
	IconLayoutSidebarLeftExpand,
	IconMoon,
	IconSearch,
	IconSun,
	IconUser,
} from "@tabler/icons-react"
import { Link, useLocation } from "@tanstack/react-router"
import { Avatar } from "@/components/Avatar.tsx"
import { useColorScheme } from "@/lib/useColorScheme.ts"

function NavLinks() {
	const location = useLocation()

	return (
		<div>
			<Button
				component={Link}
				variant={location.pathname === "/about" ? "light" : "subtle"}
				to="/about"
			>
				About
			</Button>

			<Button
				component={Link}
				variant={location.pathname === "/technology" ? "light" : "subtle"}
				to="/technology"
			>
				Technology
			</Button>
		</div>
	)
}

function DrawerNavLinks({ closeDrawer }: { closeDrawer: () => void }) {
	const location = useLocation()

	return (
		<>
			<NavLink
				component={Link}
				to="/about"
				label="About"
				variant="filled"
				leftSection={<IconInfoCircle size={16} />}
				rightSection={<IconChevronRight size={12} />}
				active={location.pathname === "/about"}
				onClick={closeDrawer}
			/>
			<NavLink
				component={Link}
				to="/technology"
				label="Technology"
				variant="filled"
				leftSection={<IconBolt size={16} />}
				rightSection={<IconChevronRight size={12} />}
				active={location.pathname === "/technology"}
				onClick={closeDrawer}
			/>
		</>
	)
}

export function Navigation() {
	const auth0 = useAuth0()
	const [opened, { toggle, close }] = useDisclosure(false)
	const { colorScheme, toggleColorScheme } = useColorScheme()

	return (
		<header className="border-b border-gray-300 h-14 mb-30 bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
			<Container size="1300px" className="flex items-center justify-between h-full">
				<Group hiddenFrom="xs">
					<Burger opened={opened} onClick={toggle} size="sm" aria-label="Toggle navigation" />
					<Link
						to="/"
						className="flex items-center gap-2 mr-4 no-underline active:text-primary-hover"
					>
						<IconBuildingBank />
						<span className="text-xl font-semibold font-display">iBank</span>
					</Link>
				</Group>

				<Group
					visibleFrom="xs"
					className={`${auth0.isAuthenticated && auth0.user && "flex justify-center w-full"}`}
				>
					{!auth0.isAuthenticated && !auth0.user ? (
						<>
							<Link
								to="/"
								className="flex items-center gap-2 mr-4 no-underline active:text-primary-hover"
							>
								<IconBuildingBank />
								<span className="text-xl font-semibold font-display">iBank</span>
							</Link>
							<NavLinks />
						</>
					) : (
						<TextInput
							placeholder="Search anything"
							leftSection={<IconSearch size={18} />}
							rightSectionWidth={70}
							rightSection={<Code>Ctrl+K</Code>}
							className="w-2/5"
						/>
					)}
				</Group>

				<Group className="absolute right-11">
					<ActionIcon onClick={toggleColorScheme} variant="subtle">
						{colorScheme === "dark" ? <IconSun /> : <IconMoon />}
					</ActionIcon>
					{auth0.isAuthenticated && auth0.user ? (
						<>
							<Indicator label={undefined} className="flex justify-items-center">
								<ActionIcon variant="subtle" onClick={undefined}>
									<IconBell />
								</ActionIcon>
							</Indicator>

							<Menu trigger="click" position="bottom-end">
								<Menu.Target>
									<Button variant="subtle" color="gray" p="0" className="h-max">
										<div className="flex items-center gap-2 px-2 py-1">
											<div className="flex flex-col items-end">
												<Text size="sm" fw={500}>
													{auth0.user.name ?? auth0.user.nickname ?? auth0.user.username}
												</Text>
												<Text size="xs" c="gray">
													{auth0.user.email}
												</Text>
											</div>
											<Avatar userId={auth0.user.sub!} h={32} />
										</div>
									</Button>
								</Menu.Target>
								<Menu.Dropdown className="shadow-sm">
									<Menu.Item component={Link} to="/profile" leftSection={<IconUser />}>
										Profile
									</Menu.Item>
									<Menu.Item
										leftSection={<IconLayoutSidebarLeftExpand />}
										onClick={() =>
											auth0.logout({
												logoutParams: {
													returnTo: window.location.origin,
												},
											})
										}
										color="red"
									>
										Sign Out
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						</>
					) : (
						<Button onClick={() => auth0.loginWithRedirect()}>Login</Button>
					)}
				</Group>
			</Container>

			<Drawer
				opened={opened}
				onClose={close}
				size="100%"
				padding={0}
				title={
					<span className="flex items-center gap-2 text-fuchsia-800">
						<IconBuildingBank />
						<span className="text-xl font-semibold font-display">iBank</span>
					</span>
				}
				hiddenFrom="xs"
				classNames={{
					header: "px-4",
					content: "flex flex-col h-full bg-gray-50",
					body: "flex flex-col flex-grow-1",
				}}
			>
				<DrawerNavLinks closeDrawer={close} />
			</Drawer>
		</header>
	)
}
export default Navigation
