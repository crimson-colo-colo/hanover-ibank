import { Button, Flex, Modal, ScrollArea, Tabs } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { ContentType } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"
import { IconCircleArrowUpRight, IconInfoCircle, IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import clsx from "clsx"
import DiscussionPanel from "@/components/discussion/DiscussionPanel.tsx"
import { FilePreview, FilePreviewControls, FilePreviewProvider } from "@/components/FilePreview.tsx"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { MetadataSidebar } from "@/components/MetadataSidebar.tsx"
import { trpc } from "@/lib/trpc.ts"

export function PreviewModal({
	closePreview,
	contentId,
}: {
	closePreview: () => void
	contentId: string
}) {
	const contentQuery = useQuery(trpc.content.get.queryOptions({ id: contentId }))
	const [sidebarOpen, { open: openSidebar, close: closeSidebar }] = useDisclosure(true)

	const content = contentQuery.data?.content
	const fileType =
		(contentQuery.data?.content.type === ContentType.Object
			? (contentQuery.data?.content.object?.Metadata?.filetype as FileType)
			: FileType.Link) ?? FileType.Unknown

	if (!content) {
		return null
	}

	return (
		<FilePreviewProvider
			content={content}
			fileType={fileType ?? FileType.Unknown}
			closeViewer={closePreview}
		>
			<Modal.Content bg="transparent" p="xl" className="flex flex-col w-full h-screen gap-lg">
				{/** biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
				{/** biome-ignore lint/a11y/useKeyWithClickEvents: backdrop */}
				<div className="absolute inset-0 z-0" onClick={closePreview} />
				<Modal.Header bdrs="md" px="lg" className="z-1">
					<Flex gap="sm" align="center">
						<FileTypeIcon fileType={fileType} strokeWidth={1.5} />
						<Modal.Title className="text-lg font-semibold font-display">
							{content.title}
						</Modal.Title>
						<FilePreviewControls />
						{contentQuery.isFetching && <IconLoader2 className="animate-spin" />}
					</Flex>
					<Flex gap="md" align="center">
						<Button
							variant="subtle"
							component={Link}
							to={`/preview/${contentId}`}
							target="_blank"
							rel="opener"
							leftSection={<IconCircleArrowUpRight />}
						>
							Open in new tab
						</Button>
						<Button
							leftSection={<IconInfoCircle />}
							variant={sidebarOpen ? "light" : "outline"}
							onClick={() => {
								if (sidebarOpen) {
									closeSidebar()
								} else {
									openSidebar()
								}
							}}
						>
							Details
						</Button>
						<Modal.CloseButton size="lg" />
					</Flex>
				</Modal.Header>
				<Flex gap="lg" className="flex-1 min-h-0 overflow-hidden z-1">
					<FilePreview />
					<ScrollArea
						w="350px"
						className={clsx(
							"min-h-0 shrink-0 h-full bg-white dark:bg-[#242424] rounded-md",
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
					</ScrollArea>
				</Flex>
			</Modal.Content>
		</FilePreviewProvider>
	)
}
