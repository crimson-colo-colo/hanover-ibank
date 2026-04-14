import { useAuth0 } from "@auth0/auth0-react"
import { UTCDate } from "@date-fns/utc"
import { ContentTable } from "@/components/ContentTable.tsx"
import { EditContentForm } from "@/components/EditContentForm.tsx"
import { FavoriteContentCard } from "@/components/FavoriteContentCard.tsx"
import { PreviewModal } from "@/components/PreviewModal.tsx"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { queryClient, trpc } from "@/lib/trpc.ts"
import "@iamjariwala/react-doc-viewer/dist/index.css"
import { Modal, SimpleGrid, Text, Title } from "@mantine/core"
import { Dropzone } from "@mantine/dropzone"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { ContentType } from "@prisma/browser.ts"
import { ContentFilter } from "@shared/enum.ts"
import { FileType } from "@shared/filetype.ts"
import { IconFileUpload } from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import type { ContentListItem } from "../../server/routers/content.ts"

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: RoleDashboard,
})

function RoleDashboard() {
	const auth0 = useAuth0()
	const [contentFilter, setContentFilter] = useState<ContentFilter>(ContentFilter.Own)
	const content = useQuery(trpc.content.list.queryOptions({ filter: contentFilter }))
	const [editingItem, setEditingItem] = useState<ContentListItem | null>(null)
	const [editDialogOpen, { open: openEditDialog, close: closeEditDialog }] = useDisclosure(false)
	const [fileEditDialogOpen, { open: openFileEditDialog, close: closeFileEditDialog }] =
		useDisclosure(false)
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

	const updateContent = useMutation(
		trpc.content.update.mutationOptions({
			onSuccess() {
				queryClient.invalidateQueries({
					queryKey: trpc.content.list.queryKey(),
				})
			},
		})
	)

	const updateContentFile = useMutation(
		trpc.content.updateFile.mutationOptions({
			onSuccess() {
				queryClient.invalidateQueries({
					queryKey: trpc.content.list.queryKey(),
				})
			},
		})
	)

	return (
		<main>
			<header className="w-full bg-primary text-white p-4 rounded-lg">
				<Title>
					Welcome,{" "}
					{auth0.user?.name ?? auth0.user?.nickname ?? auth0.user?.preferred_username ?? "User"}
				</Title>
				<small className="uppercase tracking-wider text-gray-200 font-semibold mb-3">
					{content.data ? employeeRoleDisplayName[content.data.role] : ""}
				</small>
			</header>

			<div>
				<Title order={3} className="mt-6 mb-4">
					Your Favorites
				</Title>
				<SimpleGrid minColWidth={250} spacing="md">
					{favoriteContent.isLoading ? (
						<p>Loading favorite content...</p>
					) : favoriteContent.isError ? (
						<p className="text-red-500">
							Failed to load favorite content: {favoriteContent.error.message}
						</p>
					) : favoriteContent.data?.content.length === 0 ? (
						<p>You have no favorite content.</p>
					) : (
						favoriteContent.data!.content.map((item) => {
							const object = favoriteContent.data!.objectMetadata.get(item.id)
							return (
								<FavoriteContentCard
									fileName={item.title}
									key={item.id}
									contentId={item.id}
									contentUrl={item.type === ContentType.Link ? item.url : null}
									contentType={
										item.type === "Link"
											? FileType.Link
											: ((object?.Metadata?.filetype as FileType) ?? FileType.Unknown)
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
					{content.isLoading ? (
						<p>Loading content...</p>
					) : content.isError ? (
						<p className="text-red-500">Failed to load content: {content.error.message}</p>
					) : content.data?.content.length === 0 ? (
						<p>No content available.</p>
					) : (
						<ContentTable
							data={content.data!}
							openEditDialog={(item) => {
								setEditingItem(item)
								openEditDialog()
							}}
							openFileEditDialog={(item) => {
								setEditingItem(item)
								openFileEditDialog()
							}}
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
				<Modal opened={editDialogOpen} onClose={closeEditDialog} title="Edit Content Metadata">
					{editingItem && (
						<EditContentForm
							content={{
								...editingItem,
								tags: structuredClone(editingItem.tags),
								expirationDate: editingItem.expirationDate.toISOString().split("T")[0],
								lastModifiedDate: editingItem.lastModifiedDate.toISOString().split("T")[0],
							}}
							ownerEmail={editingItem.owner.email}
							onSubmit={(values) => {
								updateContent.mutate(values)
								setEditingItem(null)
								closeEditDialog()
							}}
						/>
					)}
				</Modal>
				<Modal opened={fileEditDialogOpen} onClose={closeFileEditDialog} title="Edit Content File">
					<Text mb="md">
						Updating <b>{editingItem?.title}</b> with a new copy/version. This will replace the
						existing file but keep the same metadata.
					</Text>
					<div className="grid grid-cols-2 mb-4">
						<span className="font-semibold">Content owner</span>
						<span>{editingItem?.owner.email}</span>
						<span className="font-semibold">Last modified</span>
						<span>{editingItem && new UTCDate(editingItem.lastModifiedDate).toLocaleString()}</span>
						<span className="font-semibold">Expiration date</span>
						<span>{editingItem && new UTCDate(editingItem.expirationDate).toLocaleString()}</span>
					</div>
					{editingItem && (
						<Dropzone
							onDrop={async (files) => {
								if (files.length === 0) return
								await updateContentFile.mutateAsync({
									id: editingItem.id,
									file: new Uint8Array(await files[0].arrayBuffer()).toBase64(),
								})
								setEditingItem(null)
								closeFileEditDialog()
								notifications.show({
									title: "File updated",
									message: "The file has been updated successfully.",
									color: "emerald",
								})
							}}
							loading={updateContentFile.isPending}
							maxFiles={1}
							maxSize={50_000_000_000}
							onReject={(files) => {
								notifications.show({
									title: "Upload failed",
									message: files[0].errors.join("; "),
									color: "red",
								})
							}}
							className="bg-gray-50 hover:bg-gray-100"
						>
							<div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4 p-12">
								<IconFileUpload size={48} className="" stroke={1} />
								<Text className="text-center">
									Drag and drop a file here, or click to select a file
								</Text>
							</div>
						</Dropzone>
					)}
				</Modal>
				<Modal.Root
					opened={filePreviewOpen}
					onClose={closeFilePreview}
					fullScreen
					transitionProps={{ transition: "fade", duration: 200 }}
				>
					<Modal.Overlay backgroundOpacity={0.55} blur={3} />
					{selectedContent && selectedContentFileType && (
						<PreviewModal
							closeFilePreview={closeFilePreview}
							content={selectedContent}
							fileType={selectedContentFileType}
						/>
					)}
				</Modal.Root>
			</div>
		</main>
	)
}
