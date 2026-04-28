import { useAuth0 } from "@auth0/auth0-react"
import { Modal, SimpleGrid, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import type { FileType } from "@shared/filetype.ts"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { AccountStatisticsModule } from "@/components/dashboard/AccountStatisticsModule.tsx"
import { ExpiringContentModule } from "@/components/dashboard/ExpiringContentModule.tsx"
import { FavoriteContentModule } from "@/components/dashboard/FavoriteContentModule.tsx"
import { PopularFilesModule } from "@/components/dashboard/PopularFilesModule.tsx"
import { PopularLinksModule } from "@/components/dashboard/PopularLinksModule.tsx"
import { RecentlyViewedModule } from "@/components/dashboard/RecentlyViewedModule.tsx"
import { PreviewModal } from "@/components/PreviewModal.tsx"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: RoleDashboard,
})

function RoleDashboard() {
	const auth0 = useAuth0()
	const profile = useQuery(trpc.user.getProfile.queryOptions())
	const [filePreviewOpen, { open: openFilePreviewModal, close: _closeFilePreview }] =
		useDisclosure(false)
	const [selectedContent, setSelectedContent] = useState<string | null>(null)
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

			<SimpleGrid cols={2} spacing="md" mt="md">
				<FavoriteContentModule
					setSelectedContent={setSelectedContent}
					setSelectedContentFileType={setSelectedContentFileType}
					openFilePreviewModal={openFilePreviewModal}
				/>
				<RecentlyViewedModule
					setSelectedContent={setSelectedContent}
					setSelectedContentFileType={setSelectedContentFileType}
					openFilePreviewModal={openFilePreviewModal}
				/>
				<PopularLinksModule
					setSelectedContent={setSelectedContent}
					setSelectedContentFileType={setSelectedContentFileType}
					openFilePreviewModal={openFilePreviewModal}
				/>
				<PopularFilesModule
					setSelectedContent={setSelectedContent}
					setSelectedContentFileType={setSelectedContentFileType}
					openFilePreviewModal={openFilePreviewModal}
				/>
				<ExpiringContentModule
					setSelectedContent={setSelectedContent}
					setSelectedContentFileType={setSelectedContentFileType}
					openFilePreviewModal={openFilePreviewModal}
				/>
				<AccountStatisticsModule />
				<Modal.Root
					opened={filePreviewOpen}
					onClose={closeFilePreview}
					fullScreen
					shadow="none"
					transitionProps={{ transition: "fade", duration: 200 }}
				>
					<Modal.Overlay backgroundOpacity={0.55} blur={3} />
					{selectedContent && selectedContentFileType && (
						<PreviewModal closePreview={closeFilePreview} contentId={selectedContent} />
					)}
				</Modal.Root>
			</SimpleGrid>
		</main>
	)
}
