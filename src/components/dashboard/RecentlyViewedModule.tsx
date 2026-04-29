import { Button, Flex, Paper, Stack, Text, Title } from "@mantine/core"
import { useElementSize } from "@mantine/hooks"
import { ContentType } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"
import { IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { formatDistanceToNow } from "date-fns"
import { Avatar } from "@/components/Avatar.tsx"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { trpc } from "@/lib/trpc.ts"

export function RecentlyViewedModule({
	setSelectedContent,
	setSelectedContentFileType,
	openFilePreviewModal,
}: {
	setSelectedContent: (param: React.SetStateAction<string | null>) => void
	setSelectedContentFileType: (param: React.SetStateAction<FileType | null>) => void
	openFilePreviewModal: () => void
}) {
	const recentlyViewedContent = useQuery(trpc.content.getRecentlyViewed.queryOptions({ limit: 10 }))
	const { data: profile } = useQuery(trpc.user.getProfile.queryOptions())
	const { ref, width, height } = useElementSize()

	const maxWidth = 487
	const itemHeight = 70
	const items = width < maxWidth ? Math.floor(height / itemHeight) : 5
	const displayedContent = recentlyViewedContent.data?.slice(0, items) ?? []

	return (
		<Paper p="lg" withBorder>
			<Link
				to="/content-table"
				search={{ view: "recentlyViewed" }}
				className="no-underline text-inherit flex items-center gap-2 w-fit hover:underline mb-sm"
			>
				<Title order={3}>Recently Viewed</Title>
				{recentlyViewedContent.isFetching && <IconLoader2 className="animate-spin" size={24} />}
			</Link>
			<Stack h="90%" gap={4} align="stretch" ref={ref}>
				{displayedContent.map((item) => {
					const contentType =
						item.type === ContentType.Link
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
								openFilePreviewModal()
							}}
						>
							<FileTypeIcon
								fileType={contentType}
								size={56}
								strokeWidth={1.5}
								className="pr-5 shrink-0"
							/>
							<Flex direction="column" align="start" className="truncate">
								<Text className="pr-4 font-semibold truncate max-w-full">{item.title}</Text>
								<Flex gap={6} align="center">
									<Avatar userId={item.owner.id} className="size-5" />
									<Text c="dimmed" className="text-sm">
										{item.owner.name}
									</Text>
									<Text c="dimmed" className="text-sm">
										·
									</Text>
									<Text c="dimmed" className="text-sm">
										{formatDistanceToNow(
											item.recentTimestamps.find((entry) => entry.employeeId === profile?.id)!
												.recentlyViewed,
											{ addSuffix: true }
										).replace(/^(in )?about /, "$1")}
									</Text>
								</Flex>
							</Flex>
						</Button>
					)
				})}
			</Stack>
		</Paper>
	)
}
