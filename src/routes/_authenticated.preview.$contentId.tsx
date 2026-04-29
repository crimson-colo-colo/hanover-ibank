import { ActionIcon, Button, Flex, ScrollArea, Tabs } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { ContentType } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"
import { IconArrowLeft, IconInfoCircle, IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useCanGoBack, useRouter } from "@tanstack/react-router"
import clsx from "clsx"
import DiscussionPanel from "@/components/discussion/DiscussionPanel.tsx"
import { FilePreview, FilePreviewControls, FilePreviewProvider } from "@/components/FilePreview.tsx"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { MetadataSidebar } from "@/components/MetadataSidebar.tsx"
import { trpc, trpcClient } from "@/lib/trpc.ts"

export const Route = createFileRoute("/_authenticated/preview/$contentId")({
	component: RouteComponent,
	async head({ params: { contentId } }) {
		const content = await trpcClient.content.get.query({ id: contentId })
		return {
			meta: [{ title: `${content.content.title} | iBank` }],
		}
	},
})

function RouteComponent() {
	const { contentId } = Route.useParams()
	const router = useRouter()
	const canGoBack = useCanGoBack()

	const contentQuery = useQuery(trpc.content.get.queryOptions({ id: contentId }))
	const [sidebarOpen, { open: openSidebar, close: closeSidebar }] = useDisclosure(false)

	const content = contentQuery.data?.content
	const fileType =
		(contentQuery.data?.content.type === ContentType.Object
			? (contentQuery.data?.content.object?.Metadata?.filetype as FileType)
			: FileType.Link) ?? FileType.Unknown

	function closePreview() {
		if (window.opener) {
			window.opener.focus()
			window.close()
		} else if (canGoBack) {
			router.history.back()
		} else {
			router.navigate({ to: "/dashboard" })
		}
	}

	if (!content) {
		return null
	}

	return (
		<FilePreviewProvider
			content={content}
			fileType={fileType ?? FileType.Unknown}
			closeViewer={closePreview}
			insideModal={false}
		>
			<div className="flex flex-col w-full h-[calc(100dvh-3.5rem)] overflow-hidden">
				<Flex
					justify="space-between"
					className="w-full z-10 bg-white dark:bg-[#242424] py-4 border-b border-gray-200 dark:border-gray-800 px-4"
				>
					<Flex gap="sm" align="center">
						<ActionIcon variant="transparent" onClick={closePreview}>
							<IconArrowLeft />
						</ActionIcon>
						<FileTypeIcon fileType={fileType} />
						<div className="text-lg font-semibold font-display truncate">{content.title}</div>
						<FilePreviewControls />
						{contentQuery.isFetching && <IconLoader2 className="animate-spin" />}
					</Flex>
					<Flex gap="md" align="center" className="shrink-0">
						<Button
							variant={sidebarOpen ? "light" : "outline"}
							onClick={() => {
								if (sidebarOpen) {
									closeSidebar()
								} else {
									openSidebar()
								}
							}}
							leftSection={<IconInfoCircle />}
						>
							Details
						</Button>
					</Flex>
				</Flex>
				<Flex gap="lg" className="flex-1 min-h-0 z-1">
					<FilePreview />
					<ScrollArea.Autosize
						w="350px"
						className={clsx(
							"border border-gray-200 dark:border-gray-800 mt-4 mr-4 rounded-md bg-white dark:bg-[#242424]",
							!sidebarOpen && "hidden!"
						)}
						classNames={{
							content: "min-h-full p-md",
						}}
					>
						<Tabs defaultValue="metadata" variant="pills" className="h-full flex flex-col">
							<Tabs.List className="mb-md">
								<Tabs.Tab value="metadata">Details</Tabs.Tab>
								<Tabs.Tab value="discussions">Discussions</Tabs.Tab>
							</Tabs.List>

							<Tabs.Panel value="metadata" className="h-full">
								<MetadataSidebar content={content} closePreview={closePreview} />
							</Tabs.Panel>
							<Tabs.Panel value="discussions" className="h-full">
								<DiscussionPanel contentId={content.id} insideModal />
							</Tabs.Panel>
						</Tabs>
					</ScrollArea.Autosize>
				</Flex>
			</div>
		</FilePreviewProvider>
	)
}
