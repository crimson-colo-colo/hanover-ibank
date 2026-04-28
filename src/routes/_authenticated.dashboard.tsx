import { useAuth0 } from "@auth0/auth0-react"
import type { HeadObjectCommandOutput } from "@aws-sdk/client-s3"
import {
	Alert,
	Button,
	Card,
	Flex,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { ContentType } from "@prisma/browser.ts"
import { ContentFilter } from "@shared/enum.ts"
import { FileType } from "@shared/filetype.ts"
import type { ContentListItem, listFavoritesType, profileType } from "@shared/types.ts"
import { IconAlertOctagon, IconArrowBigRightLineFilled, IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { FavoriteContentCard } from "@/components/FavoriteContentCard.tsx"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { PreviewModal } from "@/components/PreviewModal.tsx"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: RoleDashboard,
})

type viewTotalsType =
	| {
			title: string | undefined
			contentId: string
			_sum: {
				viewCount: number | null
			}
			metadata: HeadObjectCommandOutput | undefined
	  }[]
	| undefined

function RoleDashboard() {
	const auth0 = useAuth0()
	const profile = useQuery(trpc.user.getProfile.queryOptions())
	const favoriteContent = useQuery(trpc.content.listFavorites.queryOptions())
	const allContent = useQuery(trpc.content.list.queryOptions({ filter: ContentFilter.All }))
	const linkViewTotals = useQuery(
		trpc.content.getContentViewTotals.queryOptions({ type: ContentType.Link })
	).data
	const fileViewTotals = useQuery(
		trpc.content.getContentViewTotals.queryOptions({ type: ContentType.Object })
	).data

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

			<SimpleGrid cols={2} spacing="md">
				<FavoriteContentModule
					favoriteContent={favoriteContent}
					setSelectedContent={setSelectedContent}
					setSelectedContentFileType={setSelectedContentFileType}
					openFilePreviewModel={openFilePreviewModal}
				/>
				<RecentlyViewedModule
					allContent={allContent}
					profile={profile.data}
					setSelectedContent={setSelectedContent}
					setSelectedContentFileType={setSelectedContentFileType}
					openFilePreviewModel={openFilePreviewModal}
				/>
				<PopularLinksModule
					popularLinks={linkViewTotals}
					setSelectedContent={setSelectedContent}
					setSelectedContentFileType={setSelectedContentFileType}
					openFilePreviewModel={openFilePreviewModal}
				/>
				<PopularFilesModule
					popularFiles={fileViewTotals}
					setSelectedContent={setSelectedContent}
					setSelectedContentFileType={setSelectedContentFileType}
					openFilePreviewModel={openFilePreviewModal}
				/>
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
				<div>
					<Title order={3} className="mt-6 mb-4 flex items-center gap-3">
						Expiring Content{" "}
						{favoriteContent.isFetching && <IconLoader2 className="animate-spin" />}
					</Title>
				</div>
				<div>
					<Title order={3} className="mt-6 mb-4 flex items-center gap-3">
						Statistics {favoriteContent.isFetching && <IconLoader2 className="animate-spin" />}
					</Title>
				</div>
			</SimpleGrid>
		</main>
	)
}

function FavoriteContentModule({
	favoriteContent,
	setSelectedContent,
	setSelectedContentFileType,
	openFilePreviewModel,
}: {
	favoriteContent: listFavoritesType
	setSelectedContent: (param: React.SetStateAction<string | null>) => void
	setSelectedContentFileType: (param: React.SetStateAction<FileType | null>) => void
	openFilePreviewModel: () => void
}) {
	return (
		<Paper className="mt-4" p="lg" withBorder>
			<Link
				to="/content-table"
				className="no-underline text-inherit flex items-center mb-4 gap-2 w-fit hover:underline"
			>
				<Title order={3}>Your Favorites</Title>
				{favoriteContent.isFetching && <IconLoader2 className="animate-spin" size={24} />}
			</Link>
			<SimpleGrid minColWidth="150px" spacing="sm">
				{favoriteContent.isLoading ? null : favoriteContent.isError ? (
					<Alert color="red" title="Failed to load favorite content" icon={<IconAlertOctagon />}>
						Failed to load favorite content: {favoriteContent.error.message}
					</Alert>
				) : favoriteContent.data?.content.length === 0 ? (
					<Text c="dimmed">You haven't favorited any content yet.</Text>
				) : (
					favoriteContent.data!.content.slice(0, 5).map((item) => {
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
									setSelectedContent(file.id)
									setSelectedContentFileType(type)
									openFilePreviewModel()
								}}
							/>
						)
					})
				)}
				{favoriteContent.data?.content.length !== 0 && <FavoriteShortcutCard />}
			</SimpleGrid>
		</Paper>
	)
}

function FavoriteShortcutCard() {
	return (
		<Card
			style={{ width: "100%" }}
			rel="noopener noreferrer"
			p="28"
			className="transition duration-75 cursor-pointer bg-gray-light hover:bg-gray-light-hover hover:shadow-sm"
			component={Link}
			to="/favorites"
		>
			<Card.Section>
				<Flex justify="space-between" align="center" gap="sm">
					<Text className="flex items-center font-medium">View More</Text>
				</Flex>
			</Card.Section>
			<Card.Section className="bg-white dark:bg-gray-950" bdrs="md" mt="xs">
				<Flex justify="center" align="center" h={120}>
					<IconArrowBigRightLineFilled size={48} color="gray" />
				</Flex>
			</Card.Section>
		</Card>
	)
}

function RecentlyViewedModule({
	allContent,
	profile,
	setSelectedContent,
	setSelectedContentFileType,
	openFilePreviewModel,
}: {
	allContent: listFavoritesType
	profile: profileType | undefined
	setSelectedContent: (param: React.SetStateAction<string | null>) => void
	setSelectedContentFileType: (param: React.SetStateAction<FileType | null>) => void
	openFilePreviewModel: () => void
}) {
	const recentlyViewedContent = allContent.data?.content.sort(
		(a: ContentListItem, b: ContentListItem) => {
			const firstRecentlyViewed = a.recentTimestamps
				.find((entry) => entry.employeeId === profile?.id)
				?.recentlyViewed.getTime()
			const secondRecentlyViewed = b.recentTimestamps
				.find((entry) => entry.employeeId === profile?.id)
				?.recentlyViewed.getTime()
			if (firstRecentlyViewed !== undefined && secondRecentlyViewed !== undefined)
				return secondRecentlyViewed - firstRecentlyViewed
			else return 0
		}
	)

	const topFiveRecentlyViewedContent = recentlyViewedContent?.slice(0, 5)
	return (
		<Paper className="mt-4" p="lg" withBorder>
			<Link
				to="/content-table"
				search={{ view: "recentlyViewed" }}
				className="no-underline text-inherit flex items-center mb-4 gap-2 w-fit hover:underline"
			>
				<Title order={3}>Recently Viewed</Title>
			</Link>
			<Stack h="90%" gap={4} align="stretch">
				{topFiveRecentlyViewedContent?.map((item) => {
					const contentType =
						item.type === "Link"
							? FileType.Link
							: ((item.object.Metadata?.filetype as FileType) ?? FileType.Unknown)
					return (
						<Button
							key={item.id}
							variant="subtle"
							justify="flex-start"
							h={70}
							onClick={() => {
								setSelectedContent(item.id)
								setSelectedContentFileType(contentType)
								openFilePreviewModel()
							}}
						>
							<FileTypeIcon
								style={{ flexShrink: 0 }}
								fileType={contentType}
								className="size-14 pr-5"
							/>
							<Text className="text-lg pr-4 font-bold truncate">{item.title}</Text>
							<Text c="dimmed" className="text-lg">
								{formatDistanceToNow(
									item.recentTimestamps.find((entry) => entry.employeeId === profile?.id)!
										.recentlyViewed,
									{ addSuffix: true }
								).replace(/^(in )?about /, "$1")}
							</Text>
						</Button>
					)
				})}
			</Stack>
		</Paper>
	)
}

function PopularLinksModule({
	popularLinks,
	setSelectedContent,
	setSelectedContentFileType,
	openFilePreviewModel,
}: {
	popularLinks: viewTotalsType
	setSelectedContent: (param: React.SetStateAction<string | null>) => void
	setSelectedContentFileType: (param: React.SetStateAction<FileType | null>) => void
	openFilePreviewModel: () => void
}) {
	const mostPopularLinks = popularLinks?.sort((a, b) =>
		a._sum.viewCount !== null && b._sum.viewCount !== null ? b._sum.viewCount - a._sum.viewCount : 0
	)
	const topFiveLinks = mostPopularLinks?.slice(0, 5)
	return (
		<Paper className="mt-4" p="lg" withBorder>
			<Title order={3}>Popular Links</Title>
			<Stack h="90%" gap={4} align="stretch">
				{topFiveLinks?.map((entry) => {
					return (
						<Button
							variant="subtle"
							justify="flex-start"
							key={entry.contentId}
							h={70}
							onClick={() => {
								setSelectedContent(entry.contentId)
								setSelectedContentFileType(FileType.Link)
								openFilePreviewModel()
							}}
						>
							<FileTypeIcon className="size-14 pr-5" fileType={FileType.Link} />
							<Text className="text-lg pr-4 font-bold truncate">{entry.title}</Text>
						</Button>
					)
				})}
			</Stack>
		</Paper>
	)
}

function PopularFilesModule({
	popularFiles,
	setSelectedContent,
	setSelectedContentFileType,
	openFilePreviewModel,
}: {
	popularFiles: viewTotalsType
	setSelectedContent: (param: React.SetStateAction<string | null>) => void
	setSelectedContentFileType: (param: React.SetStateAction<FileType | null>) => void
	openFilePreviewModel: () => void
}) {
	const mostPopularFiles = popularFiles?.sort((a, b) =>
		a._sum.viewCount !== null && b._sum.viewCount !== null ? b._sum.viewCount - a._sum.viewCount : 0
	)
	const topFiveFiles = mostPopularFiles?.slice(0, 5)
	return (
		<Paper className="mt-4" p="lg" withBorder>
			<Title order={3}>Popular Files</Title>
			<Stack h="90%" gap={4} align="stretch">
				{topFiveFiles?.map((entry) => {
					const fileType = (entry.metadata?.Metadata?.filetype as FileType) ?? FileType.Unknown
					return (
						<Button
							variant="subtle"
							justify="flex-start"
							key={entry.contentId}
							h={70}
							onClick={() => {
								setSelectedContent(entry.contentId)
								setSelectedContentFileType(fileType)
								openFilePreviewModel()
							}}
						>
							<FileTypeIcon className="size-14 pr-5" fileType={fileType} />
							<Text className="text-lg pr-4 font-bold truncate">{entry.title}</Text>
						</Button>
					)
				})}
			</Stack>
		</Paper>
	)
}
