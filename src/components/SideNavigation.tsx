import { useAuth0 } from "@auth0/auth0-react"
import {ActionIcon, Button, Menu, Stack, Text, Collapse, AppShell, Tooltip} from "@mantine/core"
import {
	IconBolt,
	IconBuildingBank,
	IconChartBarPopular,
	IconChevronRight,
	IconHome,
	IconInfoCircle,
	IconLayoutSidebarLeftExpand,
	IconLayoutSidebarRightExpand,
	IconList,
	IconStar,
	IconUser,
	IconUsers,
} from "@tabler/icons-react"
import { Link, useLocation } from "@tanstack/react-router"
import { trpc } from "@/lib/trpc.ts"
import { Avatar } from "@/components/Avatar.tsx"
import {useQuery} from "@tanstack/react-query";

export type sideNavigationProps = {
	collapsed: boolean
	toggleCollapsed: () => void
}

function AdminLinks({isLoading, isAdmin}: {isLoading: boolean, isAdmin: boolean | undefined}) {
	const location = useLocation()

	return (
		<>
			{isAdmin && (
				<div>
					<hr />
					<Stack gap={0}>
						<Text c="dimmed" className="ml-5 mb-2 text-sm">
							Administration
						</Text>
						<Button
							component={Link}
							variant={location.pathname === "/admin/manage-users" ? "light" : "subtle"}
							to="/admin/manage-users"
							rightSection={<IconChevronRight size={20}/>}
							justify="space-between"
							radius={0}
						>
							<IconUsers />
							<span className="p-2">Employees</span>
						</Button>
						<Button
							component={Link}
							variant={location.pathname === "/admin/analytics" ? "light" : "subtle"}
							to="/admin/analytics"
							rightSection={<IconChevronRight size={20}/>}
							justify="space-between"
							radius={0}
						>
							<IconChartBarPopular />
							<span className="p-2">Analytics</span>
						</Button>
					</Stack>
				</div>
			)}
		</>
	)
}

export function SideNavigation({collapsed, toggleCollapsed} : sideNavigationProps) {
	const auth0 = useAuth0()
	const isAdmin = useQuery(trpc.admin.isAdmin.queryOptions())
	const location = useLocation()

	return (
		<header className="relative h-full bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
			<div className="p-4">
					<Link
						to="/"
						className={`flex items-center ${collapsed ? "justify-center" : ""} gap-2 mb-4 no-underline active:text-primary-hover`}
					>
						<IconBuildingBank />
						{!collapsed && <span className="text-xl font-semibold font-display">iBank</span>}
					</Link>
				</div>
				<Stack gap={0}>
					<Button
						component={Link}
						variant={location.pathname === "/dashboard" ? "light" : "subtle"}
						to="/dashboard"
						rightSection={collapsed ? "" : <IconChevronRight size={20}/>}
						justify= {collapsed ? "center" : "space-between"}
						radius={0}
					>
						<IconHome />
						{!collapsed && <span className="p-2">Home</span>}
					</Button>
					<Button
						component={Link}
						variant={location.pathname === "/content-table" ? "light" : "subtle"}
						to="/content-table"
						rightSection={<IconChevronRight size={20}/>}
						justify="space-between"
						radius={0}
					>
						<IconList />
						<span className="p-2">Content</span>
					</Button>
					<Button
						component={Link}
						variant={location.pathname === "/favorites" ? "light" : "subtle"}
						to="/favorites"
						rightSection={<IconChevronRight size={20}/>}
						justify="space-between"
						radius={0}
					>
						<IconStar />
						<span className="p-2">Favorites</span>
					</Button>
					<Button
						component={Link}
						variant={location.pathname === "/about" ? "light" : "subtle"}
						to="/about"
						rightSection={<IconChevronRight size={20}/>}
						justify="space-between"
						radius={0}
					>
						<IconInfoCircle />
						<span className="p-2">About</span>
					</Button>
					<Button
						component={Link}
						variant={location.pathname === "/technology" ? "light" : "subtle"}
						to="/technology"
						rightSection={<IconChevronRight size={20}/>}
						justify="space-between"
						radius={0}
					>
						<IconBolt />
						<span className="p-2">Technology</span>
					</Button>
				</Stack>
				{<AdminLinks isLoading={isAdmin.isFetching} isAdmin={isAdmin.data}></AdminLinks>}
				<hr />
				<Stack>
					<Text c="dimmed" className="ml-5 mb-2 text-sm">
						Recently Viewed
					</Text>
				</Stack>
				<div className="absolute inset-x-0 bottom-0 mb-5">
					<hr />
					{auth0.isAuthenticated && auth0.user ? (
						<Menu trigger="click" position="top-start">
							<Menu.Target>
								<Button
									justify="space-between"
									variant="subtle"
									color="gray"
									className="h-12"
									radius={0}
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
					<ActionIcon variant="subtle" className="align-middle" size="md" onClick={toggleCollapsed}>
						{collapsed ? <IconLayoutSidebarLeftExpand size={26}/> :
							<IconLayoutSidebarRightExpand size={26}/>}
					</ActionIcon>
				</div>

		</header>
	)
}
export default SideNavigation
