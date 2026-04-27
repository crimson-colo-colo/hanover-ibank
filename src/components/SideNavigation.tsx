import { useAuth0 } from "@auth0/auth0-react"
import { ActionIcon, Button, Group, Menu, NavLink, Stack, Text, Tooltip } from "@mantine/core"
import { useHover } from "@mantine/hooks"
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
	IconPointFilled,
	IconStar,
	IconUser,
	IconUsers,
} from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, useLocation } from "@tanstack/react-router"
import { Avatar } from "@/components/Avatar.tsx"
import { trpc } from "@/lib/trpc.ts"

export type sideNavigationProps = {
	collapsed: boolean
	toggleCollapsed: () => void
}

const routeLinks = [
	{ pathName: "/dashboard", name: "Home", icon: IconHome },
	{ pathName: "/content-table", name: "Content", icon: IconList },
	{ pathName: "/favorites", name: "Favorites", icon: IconStar },
	{ pathName: "/about", name: "About", icon: IconInfoCircle },
	{ pathName: "/technology", name: "Technology", icon: IconBolt },
	{ pathName: "/admin/manage-users", name: "Employees", icon: IconUsers, admin: true },
	{ pathName: "/admin/analytics", name: "Analytics", icon: IconChartBarPopular, admin: true },
]

function AdminLinks({ isAdmin, collapsed }: { isAdmin: boolean | undefined; collapsed: boolean }) {
	const location = useLocation()

	const adminNavLinks = routeLinks
		.filter((link) => link.admin)
		.map((link) => (
			<Tooltip
				label={link.name}
				position="right"
				withArrow={true}
				arrowSize={8}
				disabled={!collapsed}
			>
				<Button
					component={Link}
					variant={location.pathname === link.pathName ? "light" : "subtle"}
					to={link.pathName}
					rightSection={!collapsed && <IconChevronRight size={20} />}
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
			{isAdmin &&
				(collapsed ? (
					<div>
						<Stack gap={0}>
							<div className="flex justify-center my-2">
								<IconPointFilled color="gray" />
							</div>
							{adminNavLinks}
						</Stack>
					</div>
				) : (
					<div>
						<hr />
						<Stack gap={0}>
							<Text c="dimmed" className="ml-5 mb-2 text-xs uppercase">
								Administration
							</Text>
							{adminNavLinks}
						</Stack>
					</div>
				))}
		</>
	)
}

export function SideNavigation({ collapsed, toggleCollapsed }: sideNavigationProps) {
	const auth0 = useAuth0()
	const isAdmin = useQuery(trpc.admin.isAdmin.queryOptions())
	const location = useLocation()
	const { hovered, ref } = useHover()

	const navLinks = routeLinks
		.filter((link) => !link.admin)
		.map((link) => (
			<Tooltip
				label={link.name}
				position="right"
				withArrow={true}
				arrowSize={8}
				disabled={!collapsed}
			>
				<Button
					component={Link}
					variant={location.pathname === link.pathName ? "light" : "subtle"}
					to={link.pathName}
					rightSection={!collapsed && <IconChevronRight size={20} />}
					justify={collapsed ? "center" : "space-between"}
					radius={0}
				>
					{<link.icon />}
					{!collapsed && <span className="p-2">{link.name}</span>}
				</Button>
			</Tooltip>
		))

	return (
		<header className="relative h-full bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
			<div className="flex p-4 mb-2 justify-center">
				{!collapsed && (
					<Link
						to="/"
						className={`flex items-center ${collapsed && "justify-center"} gap-2 no-underline active:text-primary-hover`}
					>
						<IconBuildingBank />
						<span className="text-xl font-semibold font-display">iBank</span>
					</Link>
				)}
				<ActionIcon
					variant="subtle"
					size="md"
					onClick={toggleCollapsed}
					ref={ref}
					className={`${!collapsed && "absolute right-0 mr-2"}`}
				>
					{collapsed ? (
						hovered ? (
							<IconLayoutSidebarLeftExpand size={26} />
						) : (
							<IconBuildingBank size={26} />
						)
					) : (
						<IconLayoutSidebarRightExpand size={26} />
					)}
				</ActionIcon>
			</div>
			<Stack gap={0}>{navLinks}</Stack>
			{<AdminLinks isAdmin={isAdmin.data} collapsed={collapsed}></AdminLinks>}

			{!collapsed && (
				<div>
					<hr />
					<Stack>
						<Text c="dimmed" className="ml-5 mb-2 text-xs uppercase">
							Recently Viewed
						</Text>
					</Stack>
				</div>
			)}

			{auth0.isAuthenticated && auth0.user && (
				<Button
					component={Link}
					to="/profile"
					justify="left"
					variant="subtle"
					color="gray"
					className={`h-14 absolute bottom-0 mb-3 ${!collapsed && "border-0 border-t border-gray-500"}`}
					radius={0}
					fullWidth
				>
					<div className="flex items-center gap-3 px-2 py-1">
						<Avatar userId={auth0.user.sub!} w={collapsed ? "lg" : "xl"} />
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
			)}
		</header>
	)
}
export default SideNavigation
