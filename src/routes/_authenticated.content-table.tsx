import { Alert, Modal, SimpleGrid, Text, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { ContentType, type EmployeeRole } from "@prisma/browser.ts"
import { ContentFilter } from "@shared/enum.ts"
import { FileType } from "@shared/filetype.ts"
import type { ContentListItem } from "@shared/types.ts"
import { IconAlertOctagon, IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import z from "zod"
import { ContentTable } from "@/components/ContentTable.tsx"
import { FavoriteContentCard } from "@/components/FavoriteContentCard.tsx"
import { PreviewModal } from "@/components/PreviewModal.tsx"
import { ContentViews } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

const searchParamSchema = z.object({
	view: z.enum(Object.values(ContentViews))
})

export const Route = createFileRoute("/_authenticated/content-table")({
	component: ContentTablePage,
	validateSearch: searchParamSchema,
})

function ContentTablePage() {
	const [contentFilter, setContentFilter] = useState<ContentFilter>(ContentFilter.Own)
	const ownContent = useQuery(trpc.content.list.queryOptions({ filter: ContentFilter.Own }))
	const allContent = useQuery(trpc.content.list.queryOptions({ filter: ContentFilter.All }))
	const [filePreviewOpen, { open: openFilePreviewModal, close: _closeFilePreview }] =
		useDisclosure(false)
	const favoriteContent = useQuery(trpc.content.listFavorites.queryOptions())

	function closeFilePreview() {
		setSelectedContent(null)
		setSelectedContentFileType(null)
		_closeFilePreview()
	}

	const [selectedContent, setSelectedContent] = useState<ContentListItem | null>(null)
	const [selectedContentFileType, setSelectedContentFileType] = useState<FileType | null>(null)

	const content = contentFilter === ContentFilter.Own ? ownContent : allContent

	const { view } = Route.useSearch()

	return (
		<main>
			<div>
				<Title order={3} className="mt-6 mb-4 flex items-center gap-3">
					Your Favorites {favoriteContent.isFetching && <IconLoader2 className="animate-spin" />}
				</Title>
				<SimpleGrid minColWidth={250} spacing="md">
					{favoriteContent.isLoading ? null : favoriteContent.isError ? (
						<Alert color="red" title="Failed to load favorite content" icon={<IconAlertOctagon />}>
							Failed to load favorite content: {favoriteContent.error.message}
						</Alert>
					) : favoriteContent.data?.content.length === 0 ? (
						<Text c="dimmed">You haven't favorited any content yet.</Text>
					) : (
						favoriteContent.data!.content.map((item) => {
							return (
								<FavoriteContentCard
									fileName={item.title}
									key={item.id}
									contentId={item.id}
									contentUrl={item.type === ContentType.Link ? item.url : null}
									contentType={
										item.type === "Link"
											? FileType.Link
											: ((item.object.Metadata?.filetype as FileType) ?? FileType.Unknown)
									}
									item={item}
									openFilePreview={(file, type) => {
										setSelectedContent(file)
										setSelectedContentFileType(type)
										openFilePreviewModal()
									}}
								/>
							)
						})
					)}
				</SimpleGrid>
			</div>

			<div>
				<section>
					{content.isError ? (
						<Alert color="red" title="Failed to load content" icon={<IconAlertOctagon />}>
							Failed to load content: {content.error.message}
						</Alert>
					) : (
						<ContentTable
							loading={content.isFetching}
							data={
								content.data ?? {
									content: [],
									role: "Employee" as EmployeeRole,
								}
							}
							filter={contentFilter}
							changeFilter={setContentFilter}
							openFilePreview={(file, type) => {
								setSelectedContent(file)
								setSelectedContentFileType(type)
								openFilePreviewModal()
							}}
							view={view}
						/>
					)}
				</section>
				<Modal.Root
					opened={filePreviewOpen}
					onClose={closeFilePreview}
					fullScreen
					shadow="none"
					transitionProps={{ transition: "fade", duration: 200 }}
				>
					<Modal.Overlay backgroundOpacity={0.55} blur={3} />
					{selectedContent && selectedContentFileType && (
						<PreviewModal closePreview={closeFilePreview} contentId={selectedContent.id} />
					)}
				</Modal.Root>
			</div>
		</main>
	)
}
