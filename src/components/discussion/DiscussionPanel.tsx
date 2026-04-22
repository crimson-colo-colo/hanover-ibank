import {
	Badge,
	Button,
	Group,
	Paper,
	SegmentedControl,
	Stack,
	Text,
	TextInput,
} from "@mantine/core"
import { IconMessagePlus, IconSearch } from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { trpc } from "@/lib/trpc.ts"
import NewThreadModal from "./NewThreadModal.tsx"
import ThreadCard, { type Thread } from "./ThreadCard.tsx"
import ThreadDrawer from "./ThreadDrawer.tsx"

export type ThreadStatus = "Open" | "Resolved" | "Archived"

export type User = {
	id: string
	name: string
	avatarUrl?: string | null
}

export type Comment = {
	id: string
	body: string
	createdAt: string
	author: User
}

type Props = {
	contentId: string
}

export default function DiscussionPanel({ contentId }: Props) {
	const threads = useQuery(
		trpc.content.discussion.getThreadsByContentId.queryOptions({ contentId: contentId })
	)
	const [activeFilter, setActiveFilter] = useState<"all" | "open" | "resolved" | "archived">("all")
	const [query, setQuery] = useState("")
	const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
	const [drawerOpened, setDrawerOpened] = useState(false)
	const [createOpened, setCreateOpened] = useState(false)

	const filteredThreads = useMemo(() => {
		return threads.data?.threads?.filter((thread) => {
			const matchesFilter =
				activeFilter === "all" || activeFilter === null
					? true
					: thread.status.toLowerCase() === activeFilter

			const searchBlob = [
				thread.title || "",
				// thread.createdBy.name, // we are incapable of doing this efficiently at the moment
				...thread.comments.map((comment) => comment.body),
			]
				.join(" ")
				.toLowerCase()

			const matchesQuery = searchBlob.includes(query.toLowerCase())
			return matchesFilter && matchesQuery
		})
	}, [threads, activeFilter, query])

	const openThread = (thread: Thread) => {
		setSelectedThread(thread)
		setDrawerOpened(true)
	}

	const threadMutation = useMutation(trpc.content.discussion.createThread.mutationOptions())

	const handleCreateThread = async (values: { title: string; body: string }) => {
		await threadMutation.mutateAsync({
			contentId: contentId,
			title: values.title,
			body: values.body,
		})
		await threads.refetch()

		setDrawerOpened(true)
	}

	const replyMutation = useMutation(trpc.content.discussion.addComment.mutationOptions())

	const handleReply = async (threadId: string, body: string) => {
		await replyMutation.mutateAsync({ threadId, body })
		await threads.refetch()
	}

	const resolveMutation = useMutation(trpc.content.discussion.resolveThread.mutationOptions())

	const handleResolve = async (threadId: string) => {
		await resolveMutation.mutateAsync({ threadId })
	}

	const reopenMutation = useMutation(trpc.content.discussion.reopenThread.mutationOptions())

	const handleReopen = async (threadId: string) => {
		await reopenMutation.mutateAsync({ threadId })
	}

	const counts = {
		all: threads.data?.threads?.length ?? "Loading",
		open: threads.data?.threads?.filter((t) => t.status === "Open")?.length ?? "Loading",
		resolved: threads.data?.threads?.filter((t) => t.status === "Resolved")?.length ?? "Loading",
		archived: threads.data?.threads?.filter((t) => t.status === "Archived")?.length ?? "Loading",
	}

	const selectedThreadFresh =
		threads.data?.threads?.find((thread) => thread.id === selectedThread?.id) ?? null

	return (
		<span>
			<Paper radius="xl" p="xl" withBorder>
				<Stack gap="xl">
					<Group justify="space-between" align="flex-start">
						<Stack gap={8}>
							<Group gap="sm">
								<Badge variant="light" radius="xl">
									Discussion
								</Badge>
							</Group>

							<Text fw={800} size="2rem">
								Talk Page
							</Text>

							<Text c="dimmed">Wiki-style discussions for questions, edits, and review notes.</Text>
						</Stack>

						<Button
							leftSection={<IconMessagePlus size={16} />}
							radius="xl"
							onClick={() => setCreateOpened(true)}
						>
							New thread
						</Button>
					</Group>

					<Paper withBorder radius="xl" p="md">
						<Group>
							<TextInput
								placeholder="Search threads"
								leftSection={<IconSearch size={16} />}
								value={query}
								onChange={(e) => setQuery(e.currentTarget.value)}
								style={{ flex: 1 }}
								radius="xl"
							/>

							<SegmentedControl
								value={activeFilter}
								onChange={setActiveFilter}
								radius="xl"
								data={[
									{ label: `All (${counts.all})`, value: "all" },
									{ label: `Open (${counts.open})`, value: "open" },
									{ label: `Resolved (${counts.resolved})`, value: "resolved" },
									{ label: `Archived (${counts.archived})`, value: "archived" },
								]}
							/>
						</Group>
					</Paper>

					<Stack gap="md">
						{filteredThreads?.map((thread) => (
							<ThreadCard
								key={thread.id}
								thread={thread}
								onOpen={openThread}
								user={threads.data!.users}
							/>
						))}
					</Stack>
				</Stack>
			</Paper>
			{threads.data !== undefined && (
				<ThreadDrawer
					opened={drawerOpened}
					thread={selectedThreadFresh}
					onClose={() => setDrawerOpened(false)}
					onReply={handleReply}
					onResolve={handleResolve}
					onReopen={handleReopen}
					users={threads.data.users}
				/>
			)}

			<NewThreadModal
				opened={createOpened}
				onClose={() => setCreateOpened(false)}
				onCreate={handleCreateThread}
			/>
		</span>
	)
}
