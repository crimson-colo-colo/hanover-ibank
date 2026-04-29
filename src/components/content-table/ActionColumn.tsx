import { ActionIcon, Flex, Menu, Tooltip } from "@mantine/core"
import { ContentType } from "@prisma/browser.ts"
import { ContentFilter } from "@shared/enum.ts"
import type { ContentListItem, Profile } from "@shared/types.ts"
import {
	IconCircleArrowUpRight,
	IconDoorEnter,
	IconDoorExit,
	IconDotsVertical,
	IconDownload,
	IconStar,
} from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import type { CellContext } from "@tanstack/react-table"
import type { Dispatch, SetStateAction } from "react"
import { queryClient, trpc, trpcClient } from "@/lib/trpc.ts"

const mutationOptions = {
	async onSettled() {
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
}

export function ActionColumn({
	info,
	selectContentForCheckout,
	openCheckOutModal,
	openCheckInModal,
	profile,
	showUnfavorite = false,
}: {
	info: CellContext<ContentListItem, unknown>
	selectContentForCheckout: Dispatch<SetStateAction<ContentListItem | null>>
	openCheckOutModal: () => void
	openCheckInModal: () => void
	profile: Profile | undefined
	showUnfavorite?: boolean
}) {
	const recentlyViewed = useMutation(trpc.content.updateRecentlyViewedTimestamp.mutationOptions())
	const incrementViewCount = useMutation(trpc.content.incrementContentViewCount.mutationOptions())
	const unfavoriteContent = useMutation(trpc.content.unfavorite.mutationOptions(mutationOptions))
	const cannotCheckOut = !info.row.original.tags
		.map((item) => item.name)
		.includes(profile?.role ?? "Not Found")

	return (
		<Flex className="content-actions w-max" gap="2px" justify="flex-end">
			{info.row.original.type === "Link" ? (
				<ActionIcon
					variant="subtle"
					size="sm"
					onClick={async () => {
						if (info.row.original.type === ContentType.Link) {
							window.open(info.row.original.url)
							await recentlyViewed.mutateAsync({ id: info.row.original.id })
							await incrementViewCount.mutateAsync({ id: info.row.original.id })
						}
					}}
				>
					<IconCircleArrowUpRight />
				</ActionIcon>
			) : (
				<ActionIcon
					variant="subtle"
					size="sm"
					onClick={async () => {
						const { url } = await trpcClient.content.download.query({
							id: info.row.original.id,
						})
						window.open(url, "_blank", "noopener")
					}}
				>
					<IconDownload />
				</ActionIcon>
			)}
			<Menu shadow="sm" width={140} closeOnItemClick={true} position="bottom-end">
				<Menu.Target>
					<ActionIcon variant="subtle" size="sm">
						<IconDotsVertical />
					</ActionIcon>
				</Menu.Target>
				<Menu.Dropdown>
					{info.row.original.type === "Object" ? (
						<Menu.Item
							leftSection={<IconDownload size={22} />}
							variant="subtle"
							onClick={async () => {
								const { url } = await trpcClient.content.download.query({
									id: info.row.original.id,
								})
								window.open(url, "_blank", "noopener")
							}}
						>
							Download
						</Menu.Item>
					) : (
						<Menu.Item
							leftSection={<IconCircleArrowUpRight size={22} />}
							variant="subtle"
							onClick={async () => {
								if (info.row.original.type === ContentType.Link) {
									window.open(info.row.original.url)
								}
								await recentlyViewed.mutateAsync({ id: info.row.original.id })
								await incrementViewCount.mutateAsync({ id: info.row.original.id })
							}}
						>
							Open link
						</Menu.Item>
					)}
					{info.row.original.checkedOutBy === null ? (
						<Tooltip
							label="You must be in the intended audience for this content to check it out"
							disabled={!cannotCheckOut}
							withArrow
							arrowSize={8}
							position="bottom"
						>
							<Menu.Item
								leftSection={<IconDoorExit size={22} />}
								variant="subtle"
								onClick={() => {
									selectContentForCheckout(info.row.original)
									openCheckOutModal()
								}}
								disabled={cannotCheckOut}
							>
								Check Out
							</Menu.Item>
						</Tooltip>
					) : info.row.original.checkedOutBy.id === profile?.id ? (
						<Menu.Item
							leftSection={<IconDoorEnter size={22} />}
							variant="subtle"
							onClick={() => {
								selectContentForCheckout(info.row.original)
								openCheckInModal()
							}}
						>
							Check In
						</Menu.Item>
					) : (
						<Tooltip
							label="This content has already been checked out"
							withArrow
							arrowSize={8}
							position="bottom"
						>
							<Menu.Item leftSection={<IconDoorExit size={22} />} variant="subtle" disabled>
								Check Out
							</Menu.Item>
						</Tooltip>
					)}
					{showUnfavorite && (
						<Menu.Item
							leftSection={<IconStar size={22} />}
							color="red"
							onClick={async () => {
								await unfavoriteContent.mutateAsync({ id: info.row.original.id })
							}}
						>
							Unfavorite
						</Menu.Item>
					)}
				</Menu.Dropdown>
			</Menu>
		</Flex>
	)
}
