import { useAuth0 } from "@auth0/auth0-react"
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
import { ContentTable } from "@/components/ContentTable.tsx"
import { FavoriteContentCard } from "@/components/FavoriteContentCard.tsx"
import { PreviewModal } from "@/components/PreviewModal.tsx"
import Search from "@/components/Search.tsx"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: RoleDashboard,
})

function RoleDashboard() {
	const auth0 = useAuth0()
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

	return (
		<main>
			<Search />

			<header className="w-full p-4 text-white rounded-lg bg-primary">
				<Title>
					Welcome,{" "}
					{auth0.user?.name ?? auth0.user?.nickname ?? auth0.user?.preferred_username ?? "User"}
				</Title>
				<small className="mb-3 font-semibold tracking-wider text-gray-200 uppercase">
					{content.data ? employeeRoleDisplayName[content.data.role] : ""}
				</small>
			</header>

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
