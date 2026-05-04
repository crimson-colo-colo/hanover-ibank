import { useAuth0 } from "@auth0/auth0-react"
import {
	ActionIcon,
	Button,
	Group,
	Image,
	Indicator,
	Kbd,
	Menu,
	Popover,
	Text,
} from "@mantine/core"
import { notifications as mantineNotifications } from "@mantine/notifications"
import { spotlight } from "@mantine/spotlight"
import type { ServiceWorkerMessage } from "@shared/types.ts"
import {
	IconBell,
	IconBuildingBank,
	IconLayoutSidebarLeftExpand,
	IconMoon,
	IconSearch,
	IconSun,
	IconUser,
} from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import clsx from "clsx"
import { useEffect, useState } from "react"
import { Avatar } from "@/components/Avatar.tsx"
import { NotificationsPopover } from "@/components/NotificationsPopover.tsx"
import { trpc } from "@/lib/trpc.ts"
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

export function Navigation() {
	const auth0 = useAuth0()
	const { colorScheme, toggleColorScheme } = useColorScheme()
	const notifications = useQuery(trpc.user.getNotifications.queryOptions())
	const [notificationsOpen, setNotificationsOpen] = useState(false)
	const location = useLocation()
	const navigate = useNavigate()

	useEffect(() => {
		if (!("serviceWorker" in navigator)) {
			return
		}

		function onMessage(event: MessageEvent) {
			const message = event.data as ServiceWorkerMessage
			if (message.type === "new_notification") {
				notifications.refetch()
				const id = mantineNotifications.show({
					title: message.notification.title,
					message: message.notification.body,
					icon: <Image src={message.notification.icon} width={24} height={24} radius="xl" />,
					className: message.notification.url ? "cursor-pointer" : undefined,
					onClick() {
						if (message.notification.url) {
							mantineNotifications.hide(id)
							navigate({ to: new URL(message.notification.url).pathname })
						}
					},
				})
			}
		}

		navigator.serviceWorker.addEventListener("message", onMessage)
		return () => {
			navigator.serviceWorker.removeEventListener("message", onMessage)
		}
	})

	return (
		<div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-between gap-md">
			<div
				className={clsx(
					"flex-1 flex justify-center items-center px-md",
					(location.pathname === "/" || !auth0.isAuthenticated) && "max-w-240 mx-auto"
				)}
			>
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
							onClick={spotlight.open}
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
					<ActionIcon id="nav-theme-toggle" onClick={toggleColorScheme} variant="subtle">
						{colorScheme === "dark" ? <IconSun /> : <IconMoon />}
					</ActionIcon>
					{auth0.isAuthenticated && auth0.user ? (
						<>
							<Popover
								position="bottom-end"
								width="500"
								withArrow
								opened={notificationsOpen}
								onChange={setNotificationsOpen}
							>
								<Popover.Target>
									<Indicator
										label={notifications.data?.length ?? 0}
										showZero={false}
										size={16}
										color="emerald"
										className="flex items-center justify-center"
									>
										<ActionIcon variant="subtle" onClick={() => setNotificationsOpen((o) => !o)}>
											<IconBell />
										</ActionIcon>
									</Indicator>
								</Popover.Target>
								<Popover.Dropdown className="shadow-sm h-80 pb-0">
									<NotificationsPopover
										notifications={notifications.data ?? []}
										closeNotifications={() => setNotificationsOpen(false)}
									/>
								</Popover.Dropdown>
							</Popover>
							<Menu trigger="click" position="bottom-end">
								<Menu.Target>
									<Button id="nav-user-menu" variant="subtle" color="gray" p="0" className="h-max">
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
		</div>
	)
}
export default Navigation
