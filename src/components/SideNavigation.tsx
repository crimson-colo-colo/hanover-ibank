import { useAuth0 } from "@auth0/auth0-react"
import { ActionIcon, Alert, Button, Stack, Text, Tooltip } from "@mantine/core"
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
	IconUsers,
	IconInfoCircleFilled,
} from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, useLocation } from "@tanstack/react-router"
import clsx from "clsx"
import { Avatar } from "@/components/Avatar.tsx"
import { trpc } from "@/lib/trpc.ts"
import { useState } from "react"

export type SideNavigationProps = {
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
				key={link.pathName}
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
					className={clsx(collapsed && "px-0")}
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
							<div className="flex justify-center my-2 py-1">
								<IconPointFilled className="fill-gray-300" size={20} />
							</div>
							{adminNavLinks}
						</Stack>
					</div>
				) : (
					<div>
						<hr />
						<Stack gap={0}>
							<Text c="dimmed" className="ml-5 mb-2 text-xs uppercase tracking-wider font-semibold">
								Administration
							</Text>
							{adminNavLinks}
						</Stack>
					</div>
				))}
		</>
	)
}

export function SideNavigation({ collapsed, toggleCollapsed }: SideNavigationProps) {
	const auth0 = useAuth0()
	const isAdmin = useQuery(trpc.admin.isAdmin.queryOptions())
	const location = useLocation()
	const { hovered, ref } = useHover()
	const [visible, setVisible] = useState(true)
	const icon = <IconInfoCircleFilled className="fill-sky-600" size={50} />

	const navLinks = routeLinks
		.filter((link) => !link.admin)
		.map((link) => (
			<Tooltip
				key={link.pathName}
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
					className={clsx(collapsed && "px-0")}
				>
					{<link.icon />}
					{!collapsed && <span className="p-2">{link.name}</span>}
				</Button>
			</Tooltip>
		))

	return (
		<header
			className="relative h-full bg-gray-50 dark:bg-gray-900 dark:border-gray-700 flex flex-col"
			ref={ref}
		>
			<div className={`flex py-4 mb-2 ${collapsed ? "justify-center" : "px-4"}`}>
				{!collapsed && (
					<Link to="/" className="flex items-center gap-2 no-underline active:text-primary-hover">
						<IconBuildingBank />
						<span className="text-xl font-semibold font-display">iBank</span>
					</Link>
				)}
				<ActionIcon
					variant="subtle"
					size="md"
					onClick={toggleCollapsed}
					className={`${!collapsed && "absolute right-3"}`}
				>
					{collapsed ? (
						hovered ? (
							<IconLayoutSidebarLeftExpand size={26} />
						) : (
							<Link to="/">
								<IconBuildingBank size={26} />
							</Link>
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
						<Text c="dimmed" className="ml-5 mb-2 text-xs uppercase tracking-wider font-semibold">
							Recently Viewed
						</Text>
					</Stack>
				</div>
			)}

			<div className="flex-1" />

			{auth0.isAuthenticated && auth0.user && (
				<Button
					component={Link}
					to="/profile"
					justify="left"
					variant="subtle"
					color="gray"
					className={clsx(
						"h-14",
						!collapsed
							? "border-0 border-t border-gray-500 gap-3 py-1"
							: "px-0 flex items-center justify-center"
					)}
					radius={0}
					fullWidth={!collapsed}
				>
					{visible && (
					<Alert
							variant="light"
							color="sky"
							title="Stay Up to Date"
							bdrs="lg"
							icon={icon}
							styles={{ icon: { width: 50, height: 50 }, title: { fontSize: "24px" } }}
							withCloseButton
							onClose={() => setVisible(false)}
							>
							Enable Push Notifications in this browser to get notified about important changes
								<Button
								component={Link}
								to="/profile"
								justify="left"
								variant="subtle"
								color="gray"
								className={clsx(
									"h-14",
									!collapsed
										? "border-0 border-t border-gray-500 gap-3 py-1"
										: "px-0 flex items-center justify-center"
								)}
								radius={0}
								fullWidth={!collapsed}
							>
								Go to Profile	
							</Button>
						
					</Alert>
					)}
					<Avatar userId={auth0.user.sub!} w={collapsed ? "30" : "32"} />
					{!collapsed && (
						<div className="flex flex-col items-start ml-3">
							<Text size="sm" fw={500}>
								{auth0.user.name ?? auth0.user.nickname ?? auth0.user.username}
							</Text>
							<Text size="xs" c="gray">
								{auth0.user.email}
							</Text>
						</div>
					)}
				</Button>
			)}
		</header>
	)
}
export default SideNavigation
