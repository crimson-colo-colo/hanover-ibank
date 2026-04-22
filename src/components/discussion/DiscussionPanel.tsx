import {
	Badge,
	Box,
	Button,
	Group,
	Paper,
	SegmentedControl,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
} from "@mantine/core"
import { IconMessagePlus, IconSearch, IconSparkles } from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { trpc } from "@/lib/trpc.ts"
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

export type Thread = {
	id: string
	contentId: string
	title?: string | null
	sectionLabel?: string | null
	status: ThreadStatus
	createdAt: string
	createdBy: User
	resolvedBy?: User | null
	resolvedAt?: string | null
	comments: Comment[]
}

type Props = {
	contentId: string
}

const mockThreads: Thread[] = [
	{
		id: "t1",
		contentId: "content-1",
		title: "Should this paragraph cite the RFC directly?",
		sectionLabel: "Authentication",
		status: "Open",
		createdAt: "2026-04-17T10:30:00.000Z",
		createdBy: { id: "u1", name: "Maya Patel" },
		comments: [
			{
				id: "c1",
				body: "I think this section is making a standards claim without pointing to the primary reference.",
				createdAt: "2026-04-17T10:31:00.000Z",
				author: { id: "u1", name: "Maya Patel" },
			},
		],
	},
	{
		id: "t2",
		contentId: "content-1",
		title: "Clarify whether this applies to mobile only",
		sectionLabel: "Client behavior",
		status: "Resolved",
		createdAt: "2026-04-15T14:08:00.000Z",
		createdBy: { id: "u3", name: "Sofia Chen" },
		resolvedBy: { id: "u2", name: "Daniel Kim" },
		resolvedAt: "2026-04-16T08:22:00.000Z",
		comments: [
			{
				id: "c2",
				body: "The wording here sounds platform-agnostic, but the implementation note below seems mobile-specific.",
				createdAt: "2026-04-15T14:10:00.000Z",
				author: { id: "u3", name: "Sofia Chen" },
			},
		],
	},
]

export default function DiscussionPanel({ contentId }: Props) {
	const threads = useQuery(
		trpc.content.discussion.getThreadsByContentId.queryOptions({ contentId: contentId })
	)
	const [drawerOpened, setDrawerOpened] = useState(false)
	const [createOpened, setCreateOpened] = useState(false)

	const filteredThreads = useMemo(() => {
		return threads.filter((thread) => {
			const matchesFilter =
				activeFilter === "all" ? true : thread.status.toLowerCase() === activeFilter

			const searchBlob = [
				thread.title || "",
				thread.sectionLabel || "",
				thread.createdBy.name,
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

	const handleCreateThread = (values: { title: string; sectionLabel: string; body: string }) => {
		const newThread: Thread = {
			id: `t-${Date.now()}`,
			contentId,
			title: values.title || null,
			sectionLabel: values.sectionLabel || null,
			status: "Open",
			createdAt: new Date().toISOString(),
			createdBy: { id: "current-user", name: "You" },
			comments: [
				{
					id: `c-${Date.now()}`,
					body: values.body,
					createdAt: new Date().toISOString(),
					author: { id: "current-user", name: "You" },
				},
			],
		}

		setThreads((prev) => [newThread, ...prev])
		setSelectedThread(newThread)
		setDrawerOpened(true)
	}

	const handleReply = (threadId: string, body: string) => {
		setThreads((prev) =>
			prev.map((thread) =>
				thread.id === threadId
					? {
							...thread,
							comments: [
								...thread.comments,
								{
									id: `c-${Date.now()}`,
									body,
									createdAt: new Date().toISOString(),
									author: { id: "current-user", name: "You" },
								},
							],
						}
					: thread
			)
		)
	}

	const handleResolve = (threadId: string) => {
		setThreads((prev) =>
			prev.map((thread) =>
				thread.id === threadId
					? {
							...thread,
							status: "Resolved",
							resolvedAt: new Date().toISOString(),
							resolvedBy: { id: "current-user", name: "You" },
						}
					: thread
			)
		)
	}

	const handleReopen = (threadId: string) => {
		setThreads((prev) =>
			prev.map((thread) =>
				thread.id === threadId
					? {
							...thread,
							status: "Open",
							resolvedAt: null,
							resolvedBy: null,
						}
					: thread
			)
		)
	}

	const counts = {
		all: threads.length,
		open: threads.filter((t) => t.status === "Open").length,
		resolved: threads.filter((t) => t.status === "Resolved").length,
		archived: threads.filter((t) => t.status === "Archived").length,
	}

	const selectedThreadFresh = threads.find((thread) => thread.id === selectedThread?.id) ?? null

	return (
		<Box p="md">
			<Paper radius="xl" p="xl" withBorder>
				<Stack gap="xl">
					<Group justify="space-between" align="flex-start">
						<Stack gap={8}>
							<Group gap="sm">
								<ThemeIcon size="xl" radius="xl" variant="light">
									<IconSparkles size={20} />
								</ThemeIcon>
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
						{filteredThreads.map((thread) => (
							<ThreadCard key={thread.id} thread={thread} onOpen={openThread} />
						))}
					</Stack>
				</Stack>
			</Paper>

			<ThreadDrawer
				opened={drawerOpened}
				thread={selectedThreadFresh}
				onClose={() => setDrawerOpened(false)}
				onReply={handleReply}
				onResolve={handleResolve}
				onReopen={handleReopen}
			/>

			<NewThreadModal
				opened={createOpened}
				onClose={() => setCreateOpened(false)}
				onCreate={handleCreateThread}
			/>
		</Box>
	)
}
