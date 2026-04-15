import { ActionIcon, Card, Divider, Flex, Menu, Text, Tooltip } from "@mantine/core"
import { FileType } from "@shared/filetype.ts"
import {
	IconCircleArrowUpRight,
	IconDotsVertical,
	IconDownload,
	IconInfoCircle,
	IconLoader2,
	IconStarFilled,
} from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { isTruncated } from "@/lib/isTruncated.ts"
import { queryClient, trpc, trpcClient } from "@/lib/trpc.ts"
import type { ContentListItem } from "../../server/routers/content.ts"

export function FavoriteContentCard({
	contentId,
	contentUrl,
	contentType,
	fileName,
	openFilePreview,
	item,
}: {
	contentId: string
	contentUrl: string | null
	contentType: FileType
	fileName: string
	openFilePreview: (info: ContentListItem, type: FileType) => void
	item: ContentListItem
}) {
	const titleRef = useRef<HTMLParagraphElement>(null)
	const [titleTruncated, setTitleTruncated] = useState(false)
	useEffect(() => {
		if (titleRef.current) {
			setTitleTruncated(isTruncated(titleRef.current))
		}
	}, [titleRef])
	const unfavoriteContent = useMutation(
		trpc.content.unfavorite.mutationOptions({
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: trpc.content.list.queryKey() })
				queryClient.invalidateQueries({ queryKey: trpc.content.listFavorites.queryKey() })
			},
		})
	)

	return (
		<Card
			// component={contentUrl ? "a" : undefined}
			//href={contentUrl ?? undefined}
			rel="noopener noreferrer"
			//target="_blank"
			p="28"
			className="transition duration-75 cursor-pointer bg-gray-light hover:bg-gray-light-hover hover:shadow-sm"
			onClick={() => {
				openFilePreview(item, contentType)
				/*
                if (contentType !== FileType.Link) {
                    openFilePreview(item, contentType)
                }*/
			}}
		>
			<Card.Section>
				<Flex justify="space-between" align="center" gap="sm">
					<Tooltip label={fileName} withArrow disabled={!titleTruncated}>
						<Text className="font-medium truncate" ref={titleRef}>
							{fileName}
						</Text>
					</Tooltip>
					<Menu position="bottom-end">
						<Menu.Target>
							<ActionIcon
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
								}}
								variant="subtle"
							>
								<IconDotsVertical size={20} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown className="shadow-sm" onClick={(e) => e.stopPropagation()}>
							<Menu.Item
								leftSection={
									unfavoriteContent.isPending ? (
										<IconLoader2 size={20} className="animate-spin" />
									) : (
										<IconStarFilled className="fill-[#f8de1f]" size={20} />
									)
								}
								onClick={(e) => {
									unfavoriteContent.mutate({ id: contentId })
								}}
							>
								Unfavorite
							</Menu.Item>
							<Divider mt="xs" mb="xs" />
							<Menu.Item
								leftSection={<IconInfoCircle size={20} />}
								onClick={async (e) => {
									openFilePreview(item, contentType)
								}}
							>
								Open Preview
							</Menu.Item>
							{contentType === FileType.Link ? (
								<Menu.Item
									leftSection={<IconCircleArrowUpRight size={20} />}
									onClick={(e) => {
										if (item.type === "Link") window.open(item.url)
									}}
								>
									Open Link
								</Menu.Item>
							) : (
								<Menu.Item
									leftSection={<IconDownload size={20} />}
									onClick={async (e) => {
										const { url } = await trpcClient.content.download.query({ id: contentId })
										window.open(url, "_blank", "noopener")
									}}
								>
									Download
								</Menu.Item>
							)}
						</Menu.Dropdown>
					</Menu>
				</Flex>
			</Card.Section>
			<Card.Section className="bg-white dark:bg-gray-950" bdrs="md" mt="xs">
				<Flex justify="center" align="center" h={120}>
					<FileTypeIcon fileType={contentType} size={40} strokeWidth={1.5} />
				</Flex>
			</Card.Section>
		</Card>
	)
}
