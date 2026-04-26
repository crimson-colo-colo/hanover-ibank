import { useAuth0 } from "@auth0/auth0-react"
import {
	ActionIcon,
	Button,
	Menu,
	Stack,
	Text,
	Collapse,
	AppShell,
	Tooltip,
	NavLink
} from "@mantine/core"
import {
	IconBolt,
	IconBuildingBank,
	IconChartBarPopular,
	IconChevronRight,
	IconHome,
	IconInfoCircle,
	IconLayoutSidebarLeftExpand,
	IconLayoutSidebarRightExpand,
	IconList, IconPointFilled,
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

const routeLinks = [
	{pathName: "/dashboard", name: "Home", icon: IconHome},
	{pathName: "/content-table", name: "Content", icon: IconList},
	{pathName: "/favorites", name: "Favorites", icon: IconStar},
	{pathName: "/about", name: "About", icon: IconInfoCircle},
	{pathName: "/technology", name: "Technology", icon: IconBolt},
	{pathName: "/admin/manage-users", name: "Employees", icon: IconUsers, admin: true},
	{pathName: "/admin/analytics", name: "Analytics", icon: IconChartBarPopular, admin: true},
]

function AdminLinks({isLoading, isAdmin, collapsed}: {isLoading: boolean, isAdmin: boolean | undefined, collapsed: boolean},) {
	const location = useLocation()

	const adminNavLinks = routeLinks.filter((link) => link.admin).map((link) => (
		<Tooltip label={link.name} position="right" withArrow arrowSize={8} disabled={!collapsed}>
			<Button
				component={Link}
				variant={location.pathname === link.pathName ? "light" : "subtle"}
				to={link.pathName}
				rightSection={!collapsed && <IconChevronRight size={20}/>}
				justify={collapsed ? "center" : "space-between"}
				radius={0}
			>
				{<link.icon />}
				{!collapsed && <span className="p-2">{link.name}</span>}
			</Button>
		</Tooltip>
	))

	return (
		<>
			{isAdmin && (
				collapsed ? (
					<div>
						<Stack gap={0} className="items-center">
							<div className="my-2">
								<IconPointFilled color="gray"/>
							</div>
							{adminNavLinks}
						</Stack>
					</div>
				) : (
					<div>
						<hr />
						<Stack gap={0}>
							<Text c="dimmed" className="ml-5 mb-2 text-sm">
								Administration
							</Text>
							{adminNavLinks}
						</Stack>
					</div>
				))}
		</>
	)
}

export function SideNavigation({collapsed, toggleCollapsed} : sideNavigationProps) {
	const auth0 = useAuth0()
	const isAdmin = useQuery(trpc.admin.isAdmin.queryOptions())
	const location = useLocation()

	const navLinks = routeLinks.filter((link) => !link.admin).map((link) => (
		<Tooltip label={link.name} position="right" withArrow arrowSize={8} disabled={!collapsed}>
			<Button
				component={Link}
				variant={location.pathname === link.pathName ? "light" : "subtle"}
				to={link.pathName}
				rightSection={!collapsed && <IconChevronRight size={20}/>}
				justify={collapsed ? "center" : "space-between"}
				radius={0}
			>
				{<link.icon/>}
				{!collapsed && <span className="p-2">{link.name}</span>}
			</Button>
		</Tooltip>
	))

	return (
		<header className="relative h-full bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
			<div className="p-4">
					<Link
						to="/"
						className={`flex items-center ${collapsed && "justify-center"} gap-2 mb-4 no-underline active:text-primary-hover`}
					>
						<IconBuildingBank />
						{!collapsed && <span className="text-xl font-semibold font-display">iBank</span>}
					</Link>
				</div>
				<Stack gap={0}>
					{navLinks}
				</Stack>
				{<AdminLinks isLoading={isAdmin.isFetching} isAdmin={isAdmin.data} collapsed={collapsed}></AdminLinks>}

			{!collapsed &&
				<div>
					<hr />
					<Stack>
						<Text c="dimmed" className="ml-5 mb-2 text-sm">
							Recently Viewed
						</Text>
					</Stack>
				</div>
			}

			<div className={collapsed ? "absolute inset-x-0 bottom-0 mb-5" : "absolute inset-x-0 bottom-0 mb-5  flex items-center"}>
				{!collapsed && <hr />}
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
									<Avatar userId={auth0.user.sub!} h={collapsed ? 26 : 32}/>
									{!collapsed && (
										<div className="flex flex-col items-start">
											<Text size="sm" fw={500}>
												{auth0.user.name ?? auth0.user.nickname ?? auth0.user.username}
											</Text>
											<Text size="xs" c="gray">
												{auth0.user.email}
											</Text>
										</div>
									)}
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
				<div className={collapsed ? "flex justify-center" : "flex justify-end-safe"}>
					<ActionIcon variant="subtle" size="md" onClick={toggleCollapsed}>
						{collapsed ? <IconLayoutSidebarLeftExpand size={26}/> :
							<IconLayoutSidebarRightExpand size={26}/>}
					</ActionIcon>
				</div>
			</div>

		</header>
	)
}
export default SideNavigation
