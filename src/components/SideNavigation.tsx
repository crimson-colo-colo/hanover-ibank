import { useAuth0 } from "@auth0/auth0-react"
import { Button, Menu, Stack, Text } from "@mantine/core"
import {
	IconBolt,
	IconBuildingBank,
	IconChartBarPopular,
	IconChevronRight,
	IconHome,
	IconInfoCircle,
	IconLayoutSidebarLeftExpand,
	IconList,
	IconStar,
	IconUser,
	IconUsers,
} from "@tabler/icons-react"
import { Link, useLocation } from "@tanstack/react-router"
import { Avatar } from "@/components/Avatar.tsx"

export function SideNavigation() {
	const auth0 = useAuth0()
	const location = useLocation()

	return (
		<header className="relative h-screen bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
			<div className="p-4">
				<Link
					to="/"
					className="flex items-center gap-2 mb-4 no-underline active:text-primary-hover"
				>
					<IconBuildingBank />
					<span className="text-xl font-semibold font-display">iBank</span>
				</Link>
			</div>
			<Stack>
				<Button
					component={Link}
					variant={location.pathname === "/dashboard" ? "light" : "subtle"}
					to="/dashboard"
					rightSection={<IconChevronRight />}
					justify="space-between"
				>
					<IconHome />
					<span className="p-2">Home</span>
				</Button>
				<Button
					component={Link}
					variant={location.pathname === "/admin/manage-users" ? "light" : "subtle"}
					to="/"
					rightSection={<IconChevronRight />}
					justify="space-between"
				>
					<IconList />
					<span className="p-2">Content</span>
				</Button>
				<Button
					component={Link}
					variant={location.pathname === "/admin/manage-users" ? "light" : "subtle"}
					to="/"
					rightSection={<IconChevronRight />}
					justify="space-between"
				>
					<IconStar />
					<span className="p-2">Favorites</span>
				</Button>
				<Button
					component={Link}
					variant={location.pathname === "/admin/manage-users" ? "light" : "subtle"}
					to="/"
					rightSection={<IconChevronRight />}
					justify="space-between"
				>
					<IconInfoCircle />
					<span className="p-2">About</span>
				</Button>
				<Button
					component={Link}
					variant={location.pathname === "/admin/manage-users" ? "light" : "subtle"}
					to="/"
					rightSection={<IconChevronRight />}
					justify="space-between"
				>
					<IconBolt />
					<span className="p-2">Technology</span>
				</Button>
			</Stack>
			<hr />
			<Stack>
				<Text c="dimmed" className="pl-5">
					Administration
				</Text>
				<Button
					component={Link}
					variant={location.pathname === "/admin/manage-users" ? "light" : "subtle"}
					to="/admin/manage-users"
					rightSection={<IconChevronRight />}
					justify="space-between"
				>
					<IconUsers />
					<span className="p-2">Employees</span>
				</Button>
				<Button
					component={Link}
					variant={location.pathname === "/admin/analytics" ? "light" : "subtle"}
					to="/admin/analytics"
					rightSection={<IconChevronRight />}
					justify="space-between"
				>
					<IconChartBarPopular />
					<span className="p-2">Analytics</span>
				</Button>
			</Stack>
			<hr />
			<Stack>
				<Text c="dimmed" className="pl-5">
					Recently Viewed
				</Text>
			</Stack>
			<div className="absolute inset-x-0 bottom-0 mb-5">
				{auth0.isAuthenticated && auth0.user ? (
					<Menu trigger="click" position="right">
						<Menu.Target>
							<Button
								rightSection={<IconChevronRight />}
								justify="space-between"
								variant="subtle"
								color="gray"
								fullWidth
							>
								<div className="flex items-center gap-2 px-2 py-1">
									<Avatar userId={auth0.user.sub!} h={32} />
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
						<Menu.Dropdown className="shadow-sm">
							<Menu.Item component={Link} to="/profile" leftSection={<IconUser />}>
								Profile
							</Menu.Item>
							<Menu.Item
								leftSection={<IconLayoutSidebarLeftExpand />}
								onClick={() => {
									auth0.logout({ logoutParams: { returnTo: window.location.origin } })
								}}
								color="red"
							>
								Sign Out
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				) : (
					<Button
						onClick={() => {
							auth0.loginWithRedirect()
						}}
						fullWidth
					>
						Login
					</Button>
				)}
			</div>
		</header>
	)
}
export default SideNavigation
