import { Badge, Card, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core"
import type { Thread } from "@shared/types.ts"
import { IconChevronRight, IconClock, IconMessageCircle } from "@tabler/icons-react"
import { Avatar } from "@/components/Avatar.tsx"
import type { ThreadStatus } from "./DiscussionPanel.tsx"

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date)
}

export function getStatusColor(status: ThreadStatus) {
	if (status === "Open") return "blue"
	if (status === "Resolved") return "green"
	return "gray"
}

type Users = Map<
	string,
	{
		id: string
		name: string
		email: string
		username: string
	}
>

type Props = {
	thread: Thread
	onOpen: (thread: Thread) => void
	user: Users
}

export default function ThreadCard({ thread, onOpen, user }: Props) {
	const preview = thread.comments[thread.comments.length - 1]?.body ?? "No comments yet"

	return (
		<Card
			withBorder
			className="cursor-pointer transition-shadow hover:shadow-sm"
			onClick={() => onOpen(thread)}
		>
			<Stack gap="xs">
				<Group justify="space-between" align="flex-start">
					<Stack gap={8} className="flex-1">
						<Group gap="xs">
							<Badge color={getStatusColor(thread.status)} variant="light">
								{thread.status}
							</Badge>
						</Group>

						<Title order={6} size="lg">
							{thread.title || "Untitled thread"}
						</Title>
					</Stack>

					<ThemeIcon variant="light" radius="xl">
						<IconChevronRight size={16} />
					</ThemeIcon>
				</Group>

				<Text c="dimmed" size="sm" lineClamp={2}>
					{preview}
				</Text>

				<Group justify="space-between" mt="sm">
					<Group gap="sm">
						<Avatar
							className="w-6 h-6 shrink-0"
							width={24}
							height={24}
							radius="100%"
							userId={thread.createdBy.id}
						/>
						<Text size="sm" c="dimmed">
							{user.get(thread.createdBy.id)?.name}
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
