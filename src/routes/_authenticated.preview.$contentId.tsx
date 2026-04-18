import { ActionIcon, Button, Flex, ScrollArea } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { FileType } from "@shared/filetype.ts"
import { IconArrowLeft, IconInfoCircle, IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useCanGoBack, useRouter } from "@tanstack/react-router"
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
		(contentQuery.data?.content.object?.Metadata?.filetype as FileType) ?? FileType.Unknown

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
			<div className="flex flex-col w-full h-[calc(100dvh-5.5rem)] overflow-hidden">
				<Flex
					justify="space-between"
					className="w-full z-10 bg-white dark:bg-[#242424] py-4 border-b border-gray-200 dark:border-gray-800 -mt-4"
				>
					<Flex gap="sm" align="center">
						<ActionIcon variant="transparent" onClick={closePreview}>
							<IconArrowLeft />
						</ActionIcon>
						<FileTypeIcon fileType={fileType} />
						<div className="text-lg font-semibold font-display">{content.title}</div>
						<FilePreviewControls />
						{contentQuery.isFetching && <IconLoader2 className="animate-spin" />}
					</Flex>
					<Flex gap="md" align="center">
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
					{sidebarOpen && (
						<ScrollArea.Autosize className="border border-gray-200 dark:border-gray-800 mt-4 rounded-md">
							<MetadataSidebar insideModal={false} content={content} closePreview={closePreview} />
						</ScrollArea.Autosize>
					)}
				</Flex>
			</div>
		</FilePreviewProvider>
	)
}
