import { Alert, Card, Flex, Paper, SimpleGrid, Text, Title } from "@mantine/core"
import { ContentType } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"
import {
	IconAlertOctagon,
	IconArrowBigRightLineFilled,
	IconLoader2,
	IconStar,
} from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { FavoriteContentCard } from "@/components/FavoriteContentCard.tsx"
import { trpc } from "@/lib/trpc.ts"

export function FavoriteContentModule({
	setSelectedContent,
	setSelectedContentFileType,
	openFilePreviewModal,
}: {
	setSelectedContent: (param: React.SetStateAction<string | null>) => void
	setSelectedContentFileType: (param: React.SetStateAction<FileType | null>) => void
	openFilePreviewModal: () => void
}) {
	const favoriteContent = useQuery(trpc.content.listFavorites.queryOptions())
	return (
		<Paper p="lg" withBorder className="flex flex-col">
			<Link
				to="/favorites"
				className="no-underline text-inherit flex items-center mb-sm gap-2 w-fit hover:underline"
			>
				<Title order={3}>Your Favorites</Title>
				{favoriteContent.isFetching && <IconLoader2 className="animate-spin" size={24} />}
			</Link>
			{favoriteContent.isLoading ? null : favoriteContent.isError ? (
				<Alert color="red" title="Failed to load favorite content" icon={<IconAlertOctagon />}>
					Failed to load favorite content: {favoriteContent.error.message}
				</Alert>
			) : favoriteContent.data?.content.length === 0 ? (
				<Flex className="w-full flex-1" direction="column" align="center" justify="center">
					<IconStar size={48} className="mx-auto mb-4 stroke-dimmed" strokeWidth={1.5} />
					<Text c="dimmed">You haven't favorited any content yet.</Text>
				</Flex>
			) : (
				<SimpleGrid minColWidth="150px" spacing="sm">
					{favoriteContent.data?.content.slice(0, 5).map((item) => {
						return (
							<FavoriteContentCard
								size="sm"
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
									openFilePreviewModal()
								}}
							/>
						)
					})}
					{favoriteContent.data?.content.length !== 0 && <FavoriteShortcutCard />}
				</SimpleGrid>
			)}
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
