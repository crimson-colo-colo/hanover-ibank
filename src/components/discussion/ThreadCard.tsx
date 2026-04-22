import { Avatar, Badge, Card, Group, Stack, Text, ThemeIcon } from "@mantine/core"
import type { ContentTalkThread } from "@prisma/browser.ts"
import { IconChevronRight, IconClock, IconMessageCircle } from "@tabler/icons-react"
import type { Thread, ThreadStatus } from "./DiscussionPanel.tsx"

function formatDate(date: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(date))
}

function getStatusColor(status: ThreadStatus) {
	if (status === "Open") return "blue"
	if (status === "Resolved") return "green"
	return "gray"
}

type Props = {
	thread: ContentTalkThread
	onOpen: (thread: Thread) => void
}

export default function ThreadCard({ thread, onOpen }: Props) {
	const preview = thread.comments[thread.comments.length - 1]?.body ?? "No comments yet"

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
							{thread.sectionLabel ? (
								<Badge variant="outline" radius="xl">
									{thread.sectionLabel}
								</Badge>
							) : null}

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
