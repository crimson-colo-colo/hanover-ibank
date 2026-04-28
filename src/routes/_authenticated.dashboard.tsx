import { useAuth0 } from "@auth0/auth0-react"
import { Alert, Modal, SimpleGrid, Text, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { ContentType } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"
import type { ContentListItem } from "@shared/types.ts"
import { IconAlertOctagon, IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Statistics } from "@/components/AccountStatistics.tsx"
import { FavoriteContentCard } from "@/components/FavoriteContentCard.tsx"
import { PreviewModal } from "@/components/PreviewModal.tsx"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: RoleDashboard,
})

function RoleDashboard() {
	const auth0 = useAuth0()
	const profile = useQuery(trpc.user.getProfile.queryOptions())
	const favoriteContent = useQuery(trpc.content.listFavorites.queryOptions())
	const [filePreviewOpen, { open: openFilePreviewModal, close: _closeFilePreview }] =
		useDisclosure(false)
	const [selectedContent, setSelectedContent] = useState<ContentListItem | null>(null)
	const [selectedContentFileType, setSelectedContentFileType] = useState<FileType | null>(null)

	function closeFilePreview() {
		setSelectedContent(null)
		setSelectedContentFileType(null)
		_closeFilePreview()
	}

	return (
		<main>
			<header className="w-full p-4 text-white rounded-lg bg-primary">
				<Title>
					Welcome,{" "}
					{auth0.user?.name ?? auth0.user?.nickname ?? auth0.user?.preferred_username ?? "User"}
				</Title>
				<small className="mb-3 font-semibold tracking-wider text-gray-200 uppercase">
					{profile.data ? employeeRoleDisplayName[profile.data.role!] : ""}
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
		</main>
	)
}
