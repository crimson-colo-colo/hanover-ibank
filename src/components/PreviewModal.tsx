import { Flex, Modal } from "@mantine/core"
import { FileType } from "@shared/filetype.ts"
import { useQuery } from "@tanstack/react-query"
import { FilePreview, FilePreviewControls, FilePreviewProvider } from "@/components/FilePreview.tsx"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { MetadataSidebar } from "@/components/MetadataSidebar.tsx"
import { trpc } from "@/lib/trpc.ts"

export function PreviewModal({
	closeFilePreview,
	contentId,
}: {
	closeFilePreview: () => void
	contentId: string
}) {
	const contentQuery = useQuery(trpc.content.get.queryOptions({ id: contentId }))

	const content = contentQuery.data?.content
	const fileType =
		(contentQuery.data?.objectMetadata?.Metadata?.filetype as FileType) ?? FileType.Unknown

	if (!content) {
		return null
	}

	return (
		<FilePreviewProvider
			content={content}
			fileType={fileType ?? FileType.Unknown}
			closeViewer={closeFilePreview}
		>
			<Modal.Content bg="transparent" p="xl" className="flex flex-col w-full h-screen gap-lg">
				{/** biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
				{/** biome-ignore lint/a11y/useKeyWithClickEvents: backdrop */}
				<div className="absolute inset-0" onClick={closeFilePreview} />
				<Modal.Header bdrs="md">
					<Flex gap="sm" align="center">
						<FileTypeIcon fileType={fileType} />
						<Modal.Title className="font-semibold font-display">{content.title}</Modal.Title>
						<FilePreviewControls />
					</Flex>
					<Modal.CloseButton />
				</Modal.Header>
				<Flex gap="lg" className="flex-1 min-h-0 overflow-hidden">
					<FilePreview />
					<MetadataSidebar content={content} />
				</Flex>
			</Modal.Content>
		</FilePreviewProvider>
	)
}
