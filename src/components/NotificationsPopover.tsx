import { ActionIcon, Flex, Paper, ScrollArea, Text, Title, Tooltip } from "@mantine/core"
import { NotificationType } from "@prisma/browser.ts"
import type { ContentNotification } from "@shared/types.ts"
import {
	IconBell,
	IconFilePlus,
	IconFileSmile,
	IconHourglassEmpty,
	IconTrashX,
	IconX,
} from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Avatar } from "@/components/Avatar.tsx"
import { trpc } from "@/lib/trpc.ts"

const getNotificationsKey = trpc.user.getNotifications.queryKey()

export function NotificationsPopover({
	notifications,
	closeNotifications,
}: {
	notifications: ContentNotification[]
	closeNotifications: () => void
}) {
	const clearAllNotifications = useMutation(
		trpc.user.clearAllNotifications.mutationOptions({
			async onMutate(params, context) {
				await context.client.cancelQueries({ queryKey: getNotificationsKey })
				const prev = context.client.getQueryData(getNotificationsKey)
				context.client.setQueryData(getNotificationsKey, (old) => [])
				return { prev }
			},
			onError(err, params, onMutateResult, context) {
				context.client.setQueryData(getNotificationsKey, onMutateResult?.prev)
			},
			async onSettled(data, error, params, onMutateResult, context) {
				await context.client.invalidateQueries({ queryKey: getNotificationsKey })
			},
		})
	)

	return (
		<Flex direction="column" style={{ height: "100%" }}>
			<Flex align="center" justify="space-between" mb="md">
				<Title order={4}>Notifications</Title>
				<Tooltip label="Clear All" withArrow>
					<ActionIcon variant="subtle" color="red" onClick={() => clearAllNotifications.mutate()}>
						<IconTrashX />
					</ActionIcon>
				</Tooltip>
			</Flex>
			{notifications.length === 0 ? (
				<div className="flex-1 flex flex-col items-center justify-center gap-4">
					<IconFileSmile size={40} strokeWidth={1.5} className="stroke-dimmed" />
					<Text c="dimmed" className="text-center">
						You&rsquo;re all caught up!
					</Text>
				</div>
			) : (
				<ScrollArea offsetScrollbars="present">
					{notifications.map((notification) => (
						<NotificationItem
							key={notification.id}
							closeNotifications={closeNotifications}
							notification={notification}
						/>
					))}
				</ScrollArea>
			)}
		</Flex>
	)
}

function NotificationItem({
	closeNotifications,
	notification,
}: {
	closeNotifications: () => void
	notification: ContentNotification
}) {
	const clearNotification = useMutation(
		trpc.user.clearNotification.mutationOptions({
			async onMutate(params, context) {
				await context.client.cancelQueries({ queryKey: getNotificationsKey })
				const prev = context.client.getQueryData(getNotificationsKey)
				context.client.setQueryData(
					getNotificationsKey,
					(old) => old?.filter((n) => n.id !== params.id) ?? []
				)
				return { prev }
			},
			onError(err, params, onMutateResult, context) {
				context.client.setQueryData(getNotificationsKey, onMutateResult?.prev)
			},
			async onSettled(data, error, variables, onMutateResult, context) {
				await context.client.invalidateQueries({ queryKey: getNotificationsKey })
			},
		})
	)

	return (
		<Paper
			withBorder
			radius="md"
			p="sm"
			mb="xs"
			className="cursor-pointer hover:shadow-sm transition text-current block"
			component={Link}
			to={`/preview/${notification.contentId}`}
			onClick={closeNotifications}
		>
			<Flex>
				<div className="w-8 shrink-0">
					{notification.actorId ? (
						<Avatar userId={notification.actorId} className="size-8" />
					) : notification.type === NotificationType.ExpiringOneDay ? (
						<IconHourglassEmpty className="size-8" strokeWidth={1.5} />
					) : notification.type === NotificationType.ContentAdded ? (
						<IconFilePlus className="size-8" strokeWidth={1.5} />
					) : (
						<IconBell className="size-8" strokeWidth={1.5} />
					)}
				</div>
				<Flex direction="column" ml="sm">
					<Flex gap="xs">
						<Text fw={500} className="text-sm flex-1">
							{notificationDisplay(notification).title}
						</Text>
						<Text c="dimmed" className="text-xs shrink-0 mt-0.5">
							{notificationTimestamp(notification.createdAt)}
						</Text>
						<ActionIcon
							size="sm"
							variant="subtle"
							color="gray"
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								clearNotification.mutate({ id: notification.id })
							}}
						>
							<IconX size={16} strokeWidth={1.5} />
						</ActionIcon>
					</Flex>
					<Text c="dimmed" className="text-xs">
						{notificationDisplay(notification).description}
					</Text>
				</Flex>
			</Flex>
		</Paper>
	)
}

function notificationDisplay(notification: ContentNotification): {
	title: string
	description: string
} {
	switch (notification.type) {
		case NotificationType.ExpiringOneDay:
			return {
				title: `${notification.content?.title} expires soon`,
				description: `It expires in one day. Review or update it to keep it up-to-date.`,
			}
		case NotificationType.ContentCheckedOut:
			return {
				title: `${notification.content?.title} checked out`,
				description: `${notification.actor?.name ?? "Someone"} checked out this content for editing.`,
			}
		case NotificationType.ContentCheckedIn:
			return {
				title: `${notification.content?.title} checked in`,
				description: `${notification.actor?.name ?? "Someone"} checked this content back in. You can review their changes now.`,
			}
		case NotificationType.ContentEdited:
			return {
				title: `${notification.content?.title} edited`,
				description: `${notification.actor?.name ?? "Someone"} made changes to this content. Review the latest version when you have a chance.`,
			}
		case NotificationType.ContentTransferred:
			return {
				title: `${notification.content?.title} transferred to you`,
				description: `${notification.actor?.name ?? "Someone"} transferred ownership of this content to you.`,
			}
		case NotificationType.ContentAdded:
			return {
				title: `${notification.content?.title} added`,
				description: `${notification.actor?.name ?? "Someone"} added this content. Check it out when you have a chance.`,
			}
		default:
			return {
				title: `Unknown notification ${notification.type}`,
				description: "An unknown event occurred.",
			}
	}
}

function notificationTimestamp(timestamp: Date): string {
	const duration = Date.now() - timestamp.getTime()
	const seconds = Math.floor(duration / 1000)
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)
	if (days > 0) {
		return `${days}d ago`
	}
	if (hours > 0) {
		return `${hours}h ago`
	}
	if (minutes > 0) {
		return `${minutes}m ago`
	}
	return "Just now"
}
