import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Flex,
	Group,
	Stack,
	Text,
	Textarea,
	Title,
} from "@mantine/core"
import { ThreadStatus } from "@prisma/browser.ts"
import type { Thread } from "@shared/types.ts"
import { IconArrowLeft, IconCheck, IconRefresh } from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { Avatar } from "@/components/Avatar.tsx"
import { getStatusColor } from "@/components/discussion/ThreadCard.tsx"
import { queryClient, trpc } from "@/lib/trpc.ts"

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date)
}

type User = {
	readonly id: string
	readonly name: string
	readonly email: string
	readonly username: string
}

type ThreadDrawerProps = {
	thread: Thread
	onClose: () => void
	users: Map<string, User>
}

export default function ThreadDrawer({ thread, onClose, users }: ThreadDrawerProps) {
	const [reply, setReply] = useState("")

	const mutationOptions = {
		async onSuccess() {
			await queryClient.invalidateQueries({
				queryKey: trpc.content.discussion.getThreadsByContentId.queryKey({
					contentId: thread.contentId,
				}),
			})
		},
	}

	const resolveThread = useMutation(
		trpc.content.discussion.resolveThread.mutationOptions(mutationOptions)
	)
	const reopenThread = useMutation(
		trpc.content.discussion.reopenThread.mutationOptions(mutationOptions)
	)
	const addComment = useMutation(
		trpc.content.discussion.addComment.mutationOptions(mutationOptions)
	)

	async function submitReply() {
		if (!reply.trim() || thread.status === ThreadStatus.Archived) return
		await addComment.mutateAsync({
			threadId: thread.id,
			body: reply,
		})
		setReply("")
	}

	return (
		<Stack gap="md">
			<Group gap="xs">
				<ActionIcon variant="transparent">
					<IconArrowLeft size={20} onClick={onClose} />
				</ActionIcon>
				{/*{thread.sectionLabel ? <Badge variant="outline">{thread.sectionLabel}</Badge> : null}*/}
				<Title order={4}>{thread.title || "Untitled thread"}</Title>
				<Badge variant="light" color={getStatusColor(thread.status)}>
					{thread.status}
				</Badge>
			</Group>
			<Group justify="space-between" align="flex-start">
				<Box>
					<Text size="sm">
						Started by <strong>{users.get(thread.createdBy.id)?.name}</strong>
					</Text>
					<Text size="xs" c="dimmed">
						{formatDate(thread.createdAt)}
					</Text>
				</Box>

				{thread.status === "Resolved" ? (
					<Button
						variant="light"
						color="blue"
						leftSection={<IconRefresh size={16} />}
						loading={reopenThread.isPending}
						onClick={async () => {
							await reopenThread.mutateAsync({ threadId: thread.id })
						}}
					>
						Reopen
					</Button>
				) : thread.status === "Open" ? (
					<Button
						variant="light"
						color="green"
						leftSection={<IconCheck size={16} />}
						loading={resolveThread.isPending}
						onClick={async () => {
							await resolveThread.mutateAsync({ threadId: thread.id })
						}}
					>
						Resolve
					</Button>
				) : null}
			</Group>

			<Stack gap="md">
				{thread.comments.map((comment) => (
					<Flex
						gap="sm"
						className="border border-gray-200 dark:border-gray-800 rounded-md p-md"
						key={comment.id}
					>
						<Avatar
							className="w-6 h-6 shrink-0"
							width={24}
							height={24}
							radius="100%"
							userId={comment.authorId}
						/>
						<div className="flex-1">
							<Group justify="space-between" mb={6}>
								<Text fw={600} size="sm">
									{users.get(comment.authorId)?.name}
								</Text>
								<Text size="xs" c="dimmed">
									{formatDate(comment.createdAt)}
								</Text>
							</Group>
							<Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
								{comment.body}
							</Text>
						</div>
					</Flex>
				))}
			</Stack>

			<Flex gap="xs" direction="column" mt="sm">
				<Text fw={700}>Reply</Text>
				<Textarea
					autosize
					minRows={4}
					placeholder="Write a reply..."
					value={reply}
					onChange={(e) => setReply(e.currentTarget.value)}
					disabled={thread.status === "Archived"}
					classNames={{
						input: "not-focus:border-gray-300 dark:not-focus:border-gray-800 focus:border-unset",
					}}
				/>
				<Button
					onClick={submitReply}
					disabled={!reply.trim() || thread.status === "Archived"}
					className="self-end"
					loading={addComment.isPending}
				>
					Post reply
				</Button>
			</Flex>
		</Stack>
	)
}
