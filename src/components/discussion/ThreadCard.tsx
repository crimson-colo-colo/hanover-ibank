import { Avatar, Badge, Card, Group, Stack, Text, ThemeIcon } from "@mantine/core"
import type { ContentTalkThread } from "@prisma/browser.ts"
import { IconChevronRight, IconClock, IconMessageCircle } from "@tabler/icons-react"
import type { trpc } from "@/lib/trpc.ts"
import type { ThreadStatus } from "./DiscussionPanel.tsx"

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date)
}

function getStatusColor(status: ThreadStatus) {
	if (status === "Open") return "blue"
	if (status === "Resolved") return "green"
	return "gray"
}

export type Thread =
	(typeof trpc.content.discussion.getThreadsByContentId)["~types"]["output"]["threads"]
export type Users =
	(typeof trpc.content.discussion.getThreadsByContentId)["~types"]["output"]["users"]

type Props = {
	thread: Thread
	onOpen: (thread: Thread) => void
	users: Users
}

export default function ThreadCard({ thread, onOpen, users }: Props) {
	const preview = thread.comments[thread.comments.length - 1]?.body ?? "No comments yet"

	//Create four functions for the four things we need from a user: we need their display name
	async function getDisplayName(userId: string) {
		await users.get(userId)
	}

	return (
		<Card
			withBorder
			radius="xl"
			padding="lg"
			shadow="sm"
			style={{ cursor: "pointer" }}
			onClick={() => onOpen(thread)}
		>
			<Stack gap="md">
				<Group justify="space-between" align="flex-start">
					<Stack gap={8} style={{ flex: 1 }}>
						<Group gap="xs">
							<Badge color={getStatusColor(thread.status)} variant="light" radius="xl">
								{thread.status}
							</Badge>
						</Group>

						<Text fw={700} size="lg">
							{thread.title || "Untitled thread"}
						</Text>
					</Stack>

					<ThemeIcon variant="light" radius="xl">
						<IconChevronRight size={16} />
					</ThemeIcon>
				</Group>

				<Text c="dimmed" size="sm" lineClamp={2}>
					{preview}
				</Text>

				<Group justify="space-between">
					<Group gap="sm">
						<Avatar radius="xl" name={thread.createdBy.name} />
						<Text size="sm" c="dimmed">
							{thread.createdBy.name}
						</Text>
					</Group>

					<Group gap="md">
						<Group gap={4}>
							<IconMessageCircle size={15} />
							<Text size="sm" c="dimmed">
								{thread.comments.length}
							</Text>
						</Group>

						<Group gap={4}>
							<IconClock size={15} />
							<Text size="sm" c="dimmed">
								{formatDate(thread.createdAt)}
							</Text>
						</Group>
					</Group>
				</Group>
			</Stack>
		</Card>
	)
}
