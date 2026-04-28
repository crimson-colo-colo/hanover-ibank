import { useAuth0 } from "@auth0/auth0-react"
import { ActionIcon, Button, Group, Indicator, Kbd, Menu, Text } from "@mantine/core"
import {
	IconBell,
	IconBuildingBank,
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
			<Button component={Link} to="/about">
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

export function Navigation() {
	const auth0 = useAuth0()
	const { colorScheme, toggleColorScheme } = useColorScheme()

	return (
		<div className="h-full px-md bg-gray-50 dark:bg-gray-900 flex items-center justify-between gap-md">
			<Group className="flex-1">
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
					<button
						className="max-w-100 flex-1 flex items-center gap-2 rounded-md cursor-text bg-white border-gray-300 border py-1.5 pl-4 pr-2 text-gray-500 w-full text-sm dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
						onClick={() => {}}
					>
						<IconSearch size={18} />
						<span className="flex-1 mr-8 text-left w-max">Search anything</span>
						<div className="flex items-center gap-1">
							<Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
						</div>
					</button>
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
		</div>
	)
}
export default Navigation
