import { Button, SegmentedControl, Stack, Text, TextInput, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import type { Thread } from "@shared/types.ts"
import { IconMessagePlus, IconSearch } from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { queryClient, trpc } from "@/lib/trpc.ts"
import NewThreadModal from "./NewThreadModal.tsx"
import ThreadCard from "./ThreadCard.tsx"
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

export default function DiscussionPanel({
	contentId,
	insideModal,
}: {
	contentId: string
	insideModal: boolean
}) {
	const threads = useQuery(
		trpc.content.discussion.getThreadsByContentId.queryOptions({ contentId: contentId })
	)
	const [activeFilter, setActiveFilter] = useState<"all" | "open" | "resolved" | "archived">("all")
	const [query, setQuery] = useState("")
	const [createModalOpen, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false)

	const [_selectedThread, setSelectedThread] = useState<Thread | null>(null)
	const selectedThread =
		threads.data?.threads.find((thread) => thread.id === _selectedThread?.id) ?? _selectedThread

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

	const createThreadMutation = useMutation(
		trpc.content.discussion.createThread.mutationOptions({
			async onSuccess() {
				await queryClient.invalidateQueries({
					queryKey: trpc.content.discussion.getThreadsByContentId.queryKey({
						contentId: contentId,
					}),
				})
			},
		})
	)

	async function onCreateThread(values: { title: string | undefined; body: string }) {
		const thread = await createThreadMutation.mutateAsync({
			contentId: contentId,
			title: values.title,
			body: values.body,
		})

		setSelectedThread(thread)
	}

	return (
		<>
			{selectedThread ? (
				<ThreadDrawer
					thread={selectedThread}
					onClose={() => setSelectedThread(null)}
					users={threads.data?.users ?? new Map()}
				/>
			) : (
				<Stack gap="md">
					<Stack gap="sm">
						<Title order={4} className="leading-tight" mb={0}>
							Discussions
						</Title>

						<Text c="dimmed">Wiki-style discussions for questions, edits, and review notes.</Text>

						<Button
							leftSection={<IconMessagePlus size={16} />}
							onClick={openCreateModal}
							className="self-end"
						>
							New thread
						</Button>
					</Stack>

					<Stack gap="xs">
						<TextInput
							placeholder="Search threads"
							leftSection={<IconSearch size={16} />}
							value={query}
							onChange={(e) => setQuery(e.currentTarget.value)}
							style={{ flex: 1 }}
						/>

						<SegmentedControl
							value={activeFilter}
							onChange={setActiveFilter}
							data={[
								{ label: "All", value: "all" },
								{ label: "Open", value: "open" },
								{ label: "Resolved", value: "resolved" },
								{ label: "Archived", value: "archived" },
							]}
						/>

						<Text size="sm" c="dimmed" className="self-end">
							{filteredThreads?.length ?? 0} {filteredThreads?.length === 1 ? "result" : "results"}
						</Text>
					</Stack>

					<Stack gap="md">
						{filteredThreads?.map((thread) => (
							<ThreadCard
								key={thread.id}
								thread={thread}
								onOpen={() => {
									setSelectedThread(thread)
								}}
								user={threads.data!.users}
							/>
						))}
					</Stack>
				</Stack>
			)}

			<NewThreadModal
				opened={createModalOpen}
				onClose={closeCreateModal}
				onCreate={onCreateThread}
			/>
		</>
	)
}
