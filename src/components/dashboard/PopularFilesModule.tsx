import { Button, Flex, Group, Paper, Stack, Text, Title } from "@mantine/core"
import { ContentType } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"
import { IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
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
				<Title order={3}>Popular Files</Title>
				{popularFiles.isFetching && <IconLoader2 className="animate-spin" size={24} />}
			</Group>
			<Stack h="90%" gap={4} align="stretch">
				{topFiveFiles?.map((item) => {
					if (item.type !== ContentType.Object) return null
					const fileType = (item.object?.Metadata?.filetype as FileType) ?? FileType.Unknown
					return (
						<Button
							variant="subtle"
							justify="flex-start"
							key={item.id}
							h={70}
							onClick={() => {
								setSelectedContent(item.id)
								setSelectedContentFileType(fileType)
								openFilePreviewModal()
							}}
						>
							<FileTypeIcon
								fileType={FileType.Link}
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
								</Flex>
							</Flex>
						</Button>
					)
				})}
			</Stack>
		</Paper>
	)
}
