import { ActionIcon, Card, Divider, Flex, Image, Menu, Text, Tooltip } from "@mantine/core"
import { ContentType } from "@prisma/browser.ts"
import { ContentFilter } from "@shared/enum.ts"
import { FileType } from "@shared/filetype.ts"
import type { ContentListItem } from "@shared/types.ts"
import {
	IconCircleArrowUpRight,
	IconDotsVertical,
	IconDownload,
	IconInfoCircle,
	IconLoader2,
	IconStarFilled,
} from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import clsx from "clsx"
import { useEffect, useRef, useState } from "react"
import { Document, Thumbnail } from "react-pdf"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { isTruncated } from "@/lib/isTruncated.ts"
import { queryClient, trpc, trpcClient } from "@/lib/trpc.ts"
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
			async onSuccess() {
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: trpc.content.list.queryKey({ filter: ContentFilter.Own }),
					}),
					queryClient.invalidateQueries({
						queryKey: trpc.content.list.queryKey({ filter: ContentFilter.All }),
					}),
					queryClient.invalidateQueries({ queryKey: trpc.content.listFavorites.queryKey() }),
				])
			},
		})
	)
	const { data: contentThumbnail, isFetching } = useQuery(
		trpc.preview.getContentUrl.queryOptions(
			{ id: item.id },
			{ enabled: item.type === ContentType.Object }
		)
	)
	const containerRef = useRef<HTMLDivElement>(null)
	const [thumbWidth, setThumbWidth] = useState<number>(200)

	useEffect(() => {
		if (containerRef.current) {
			setThumbWidth(containerRef.current.offsetWidth)
		}
	}, [])
	let thumbnail: React.ReactNode

	if (isFetching) {
		thumbnail = <IconLoader2 className={clsx("animate-spin", "text-white")} size={40} />
	} else if (contentType === FileType.Image) {
		thumbnail = (
			<Image src={contentThumbnail?.url} alt="thumbnail" className="w-full h-full object-cover" />
		)
	} else if (
		contentType === FileType.Pdf ||
		contentType === FileType.WordDocument ||
		contentType === FileType.Excel ||
		contentType === FileType.Powerpoint
	) {
		thumbnail = (
			<div className="w-full h-full overflow-hidden flex items-center justify-center bg-white">
				<Document file={contentThumbnail?.url}>
					<Thumbnail pageNumber={1} width={containerRef.current?.offsetWidth ?? thumbWidth} />
				</Document>
			</div>
		)
	}

	return (
		<Card
			rel="noopener noreferrer"
			p="28"
			className="transition duration-75 cursor-pointer bg-gray-light hover:bg-gray-light-hover hover:shadow-sm"
			onClick={() => {
				openFilePreview(item, contentType)
			}}
		>
			<Card.Section>
				<Flex justify="space-between" align="center" gap="sm">
					<Flex align="center" gap="xs" className="truncate">
						<FileTypeIcon fileType={contentType} size={24} strokeWidth={1.5} className="shrink-0" />
						<Tooltip label={fileName} withArrow disabled={!titleTruncated}>
							<Text className="font-medium truncate" ref={titleRef}>
								{fileName}
							</Text>
						</Tooltip>
					</Flex>
					<Menu position="bottom-end">
						<Menu.Target>
							<ActionIcon
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
								}}
								variant="subtle"
								className="shrink-0"
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
				<div className="w-full" style={{ aspectRatio: "1" }}>
					{thumbnail}
				</div>
			</Card.Section>
		</Card>
	)
}
