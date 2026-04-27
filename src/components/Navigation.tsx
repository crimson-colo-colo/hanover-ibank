import { useAuth0 } from "@auth0/auth0-react"
import {
	ActionIcon,
	Burger,
	Button,
	Code,
	Container,
	Drawer,
	Group,
	Image,
	Indicator,
	Menu,
	NavLink,
	Text,
	TextInput,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
	IconBell,
	IconBuildingBank,
	IconChartBar,
	IconChevronRight,
	IconHome,
	IconLayoutSidebarLeftExpand,
	IconMoon,
	IconSearch,
	IconSun,
	IconUser,
	IconUsers,
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

function DrawerNavLinks({
	isLoading,
	isAdmin,
	closeDrawer,
}: {
	isLoading: boolean
	isAdmin: boolean | undefined
	closeDrawer: () => void
}) {
	const location = useLocation()

	return (
		<>
			<NavLink
				component={Link}
				to="/"
				label="Dashboard"
				variant="filled"
				leftSection={<IconHome size={16} />}
				rightSection={<IconChevronRight size={12} />}
				active={location.pathname === "/"}
				onClick={closeDrawer}
			/>
			<NavLink
				component={Link}
				to="/analytics"
				label="Analytics"
				variant="filled"
				leftSection={<IconChartBar size={16} />}
				rightSection={<IconChevronRight size={12} />}
				active={location.pathname === "/analytics"}
				onClick={closeDrawer}
			/>
			{isAdmin && (
				<NavLink
					component={Link}
					to="/admin/manage-users"
					label="Manage Employees"
					variant="filled"
					leftSection={<IconUsers size={16} />}
					rightSection={<IconChevronRight size={12} />}
					active={location.pathname === "/admin/manage-users"}
					onClick={closeDrawer}
				/>
			)}
		</>
	)
}

function DrawerUserMenu() {
	const auth0 = useAuth0()
	if (!auth0.user) {
		return null
	}

	return (
		<Menu trigger="click" position="top-start">
			<Menu.Target>
				<Button
					variant="subtle"
					color="gray"
					p="4"
					className="border-t border-t-gray-200 hover:bg-gray-100 h-max"
					justify="start"
				>
					<div className="flex items-center gap-2 px-2 py-1">
						<Image
							h={32}
							bdrs="100%"
							className="cursor-pointer"
							src={auth0.user.picture}
							alt={auth0.user.name}
						/>
						<div className="flex flex-col items-start">
							<Text size="sm" fw={500}>
								{auth0.user.name ?? auth0.user.nickname ?? auth0.user.username}
							</Text>
							<Text size="xs" c="gray">
								{auth0.user.email}
							</Text>
						</div>
					</div>
				</Button>
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

				<Group gap={5} visibleFrom="xs">
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
						></TextInput>
					)}
				</Group>

				<Group>
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
				{/*<ScrollArea className="flex-1">
					<Divider mb="sm" />
					<DrawerNavLinks
						isLoading={isAdmin.isFetching}
						isAdmin={isAdmin.data}
						closeDrawer={close}
					/>
				</ScrollArea>*/}
				<DrawerUserMenu />
			</Drawer>
		</header>
	)
}
export default Navigation
