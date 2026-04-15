import { Button, Flex, Modal } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { FileType } from "@shared/filetype.ts"
import { IconInfoCircle, IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
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
		(contentQuery.data?.content.object?.Metadata?.filetype as FileType) ?? FileType.Unknown

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
						<FileTypeIcon fileType={fileType} />
						<Modal.Title className="text-lg font-semibold font-display">
							{content.title}
						</Modal.Title>
						<FilePreviewControls />
						{contentQuery.isFetching && <IconLoader2 className="animate-spin" />}
					</Flex>
					<Flex gap="md" align="center">
						<Button
							variant="light"
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
						<Modal.CloseButton size="lg" />
					</Flex>
				</Modal.Header>
				<Flex gap="lg" className="flex-1 min-h-0 overflow-hidden z-1">
					<FilePreview />
					{sidebarOpen && <MetadataSidebar content={content} closePreview={closePreview} />}
				</Flex>
			</Modal.Content>
		</FilePreviewProvider>
	)
}
