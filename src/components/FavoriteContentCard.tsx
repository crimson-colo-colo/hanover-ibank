import { ActionIcon, Card, Flex, Menu, Text, Tooltip } from "@mantine/core"
import { FileType } from "@shared/filetype.ts"
import {
	IconCircleArrowUpRight,
	IconDotsVertical,
	IconDownload,
	IconLoader2,
	IconStarFilled,
} from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { queryClient, trpc, trpcClient } from "@/lib/trpc.ts"
	import type {ContentListItem, ContentList} from "../../server/routers/content.ts";

function isTruncated(e: HTMLElement) {
	const temp = e.cloneNode(true) as HTMLElement

	temp.style.position = "fixed"
	temp.style.overflow = "visible"
	temp.style.whiteSpace = "nowrap"
	temp.style.visibility = "hidden"

	e.parentElement!.appendChild(temp)

	try {
		const fullWidth = temp.getBoundingClientRect().width
		const displayWidth = e.getBoundingClientRect().width

		return fullWidth > displayWidth
	} finally {
		temp.remove()
	}
}

export function FavoriteContentCard({
										contentId,
										contentUrl,
										contentType,
										fileName,
										openFilePreview,
										item
									}: {
	contentId: string,
	contentUrl: string | null,
	contentType: FileType,
	fileName: string,
	openFilePreview: (info: ContentListItem) => (void),
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
			component={contentUrl ? "a" : undefined}
			href={contentUrl ?? undefined}
			rel="noopener noreferrer"
			target="_blank"
			p="28"
			className="bg-gray-50 hover:bg-gray-100 hover:shadow-sm transition duration-75 cursor-pointer"
			onClick={ () => {
				// setDownloadingItemId(item.id)
				// try {
				// 	const { url } = await trpcClient.content.download.query({ id: item.id })
				// 	window.open(url, "_blank")
				// } finally {
				// 	setDownloadingItemId(null)
				// }

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
							<ActionIcon onClick={(e) => e.preventDefault()} variant="subtle">
								<IconDotsVertical size={20} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown className="shadow-sm">
							<Menu.Item
								leftSection={
									unfavoriteContent.isPending ? (
										<IconLoader2 size={20} className="animate-spin" />
									) : (
										<IconStarFilled className="fill-[#f8de1f]" size={20} />
									)
								}
								onClick={() => unfavoriteContent.mutate({ id: contentId })}
							>
								Unfavorite
							</Menu.Item>
							{contentType === FileType.Link ? (
								<Menu.Item
									leftSection={<IconCircleArrowUpRight size={20} />}
									onClick={async () => {
										openFilePreview(contentUrl)


									}}
								>View Details
								</Menu.Item>
							) : (
								<Menu.Item
									leftSection={<IconDownload size={20} />}
									onClick={async () => {
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
			<Card.Section bg="white" bdrs="md" mt="xs">
				<Flex justify="center" align="center" h={120}>
					<FileTypeIcon fileType={contentType} size={40} strokeWidth={1.5} />
				</Flex>
			</Card.Section>
		</Card>
	)
}
