import { Button, Flex, Group, Paper, Stack, Text, Title } from "@mantine/core"
import { ContentType } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"
import { IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Avatar } from "@/components/Avatar.tsx"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { trpc } from "@/lib/trpc.ts"

export function PopularFilesModule({
	setSelectedContent,
	setSelectedContentFileType,
	openFilePreviewModal,
}: {
	setSelectedContent: (param: React.SetStateAction<string | null>) => void
	setSelectedContentFileType: (param: React.SetStateAction<FileType | null>) => void
	openFilePreviewModal: () => void
}) {
	const popularFiles = useQuery(
		trpc.content.getContentViewTotals.queryOptions({ type: ContentType.Object })
	)
	const topFiveFiles = popularFiles.data?.slice(0, 5)
	return (
		<Paper p="lg" withBorder>
			<Group mb="sm">
				<Link
					to="/content-table"
					search={{ view: "popularFiles" }}
					className="no-underline text-inherit flex items-center mb-sm gap-2 w-fit hover:underline"
				>
					<Title order={3}>Popular Files</Title>
				</Link>
				{popularFiles.isFetching && <IconLoader2 className="animate-spin" size={24} />}
			</Group>
			<Stack h="90%" gap={4} align="stretch">
				{topFiveFiles?.map((entry) => {
					if (entry.type !== ContentType.Object) return null
					const fileType = (entry.object.Metadata?.filetype as FileType) ?? FileType.Unknown
					return (
						<Button
							variant="subtle"
							justify="flex-start"
							key={entry?.id}
							h={70}
							onClick={() => {
								setSelectedContent(entry.id)
								setSelectedContentFileType(fileType)
								openFilePreviewModal()
							}}
						>
							<FileTypeIcon
								fileType={fileType}
								size={56}
								strokeWidth={1.5}
								className="pr-5 shrink-0"
							/>
							<Flex direction="column" align="start" className="truncate">
								<Text className="pr-4 font-semibold truncate max-w-full">{entry.title}</Text>
								<Flex gap={6} align="center">
									<Avatar userId={entry.owner.id} className="size-5" />
									<Text c="dimmed" className="text-sm">
										{entry.owner.name}
									</Text>
									<Text c="dimmed" className="text-sm">
										·
									</Text>
									<Text c="dimmed" className="text-sm">
										{entry.viewCount.toLocaleString()} views
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
