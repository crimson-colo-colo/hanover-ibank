import {
	Alert,
	Button,
	Checkbox,
	Flex,
	Group,
	Modal,
	SegmentedControl,
	SimpleGrid,
	Table,
	Text,
	Title,
	Tooltip,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { ContentStatus, ContentType, type EmployeeRole, TagCategory } from "@prisma/browser.ts"
import { ContentFilter } from "@shared/enum.ts"
import { FileType } from "@shared/filetype.ts"
import type { ContentListItem, ListFavoritesQuery } from "@shared/types.ts"
import {
	IconAlertOctagon,
	IconCircleCheck,
	IconDoorEnter,
	IconDoorExit,
	IconLoader2,
	IconMessageCircleUser,
	IconProgress,
	IconSortAscending2,
	IconSortDescending2,
	IconStarOff,
} from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import clsx from "clsx"
import { formatDate } from "date-fns"
import { useMemo, useState } from "react"
import { ActionColumn } from "@/components/content-table/ActionColumn.tsx"
import { NameColumn } from "@/components/content-table/NameColumn.tsx"
import { OwnerColumn } from "@/components/content-table/OwnerColumn.tsx"
import { TagColumn } from "@/components/content-table/TagColumn.tsx"
import { TagFilterPopup } from "@/components/content-table/TagFilterPopup.tsx"
import { FavoriteContentCard } from "@/components/FavoriteContentCard.tsx"
import { PreviewModal } from "@/components/PreviewModal.tsx"
import { contentStatusDisplayName, employeeRoleDisplayName } from "@/lib/enums.ts"
import { checkedOutByFilterFn, fuzzyFilter, fuzzySort, tagFilterFn } from "@/lib/table.ts"
import { queryClient, trpc } from "@/lib/trpc.ts"

export const Route = createFileRoute("/_authenticated/favorites")({
	component: FavoritesPage,
})

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

function FavoritesPage() {
	const favoriteContent = useQuery(trpc.content.listFavorites.queryOptions())
	const [filePreviewOpen, { open: openFilePreviewModal, close: _closeFilePreview }] =
		useDisclosure(false)
	const [selectedContent, setSelectedContent] = useState<ContentListItem | null>(null)
	const [selectedContentFileType, setSelectedContentFileType] = useState<FileType | null>(null)
	const [viewMode, setViewMode] = useState<"Grid" | "List">("Grid")
	const [rowSelection, setRowSelection] = useState({})
	const [bulkUnfavoriteModal, { open: openBulkUnfavoriteModal, close: closeBulkUnfavoriteModal }] =
		useDisclosure(false)

	function closeFilePreview() {
		setSelectedContent(null)
		setSelectedContentFileType(null)
		_closeFilePreview()
	}

	return (
		<main>
			<div>
				<Group mb="md">
					<Title order={3} className="flex items-center gap-3">
						Your Favorites
					</Title>
					{favoriteContent.isFetching && <IconLoader2 className="animate-spin" />}
					<div className="flex-1"></div>
					{viewMode === "List" && (
						<Button
							leftSection={<IconStarOff />}
							disabled={Object.keys(rowSelection).length === 0}
							color="red"
							onClick={() => {
								openBulkUnfavoriteModal()
							}}
						>
							Unfavorite selected
						</Button>
					)}
					<SegmentedControl
						data={[
							{ label: "Grid", value: "Grid" },
							{ label: "List", value: "List" },
						]}
						value={viewMode}
						onChange={setViewMode}
					/>
				</Group>
				{viewMode === "Grid" ? (
					<SimpleGrid minColWidth={250} spacing="md">
						{favoriteContent.isLoading ? null : favoriteContent.isError ? (
							<Alert
								color="red"
								title="Failed to load favorite content"
								icon={<IconAlertOctagon />}
							>
								Failed to load favorite content: {favoriteContent.error.message}
							</Alert>
						) : favoriteContent.data?.content.length === 0 ? (
							<Text c="dimmed">You haven't favorited any content yet.</Text>
						) : (
							favoriteContent.data!.content.map((item) => {
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
											setSelectedContent(file)
											setSelectedContentFileType(type)
											openFilePreviewModal()
										}}
									/>
								)
							})
						)}
					</SimpleGrid>
				) : (
					<FavoritesTable
						favoriteContent={favoriteContent}
						openFilePreviewModal={(file, type) => {
							setSelectedContent(file)
							setSelectedContentFileType(type)
							openFilePreviewModal()
						}}
						rowSelection={rowSelection}
						setRowSelection={setRowSelection}
						openBulkUnfavoriteModal={openBulkUnfavoriteModal}
						closeBulkUnfavoriteModal={closeBulkUnfavoriteModal}
						bulkUnfavoriteModal={bulkUnfavoriteModal}
					/>
				)}
			</div>
			<Modal.Root
				opened={filePreviewOpen}
				onClose={closeFilePreview}
				fullScreen
				shadow="none"
				transitionProps={{ transition: "fade", duration: 200 }}
			>
				<Modal.Overlay backgroundOpacity={0.55} blur={3} />
				{selectedContent && selectedContentFileType && (
					<PreviewModal closePreview={closeFilePreview} contentId={selectedContent.id} />
				)}
			</Modal.Root>
		</main>
	)
}

function FavoritesTable({
	favoriteContent,
	openFilePreviewModal,
	rowSelection,
	setRowSelection,
	openBulkUnfavoriteModal,
	closeBulkUnfavoriteModal,
	bulkUnfavoriteModal,
}: {
	favoriteContent: ListFavoritesQuery
	openFilePreviewModal: (item: ContentListItem, type: FileType) => void
	rowSelection: Record<string, boolean>
	setRowSelection: (
		updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
	) => void
	openBulkUnfavoriteModal: () => void
	closeBulkUnfavoriteModal: () => void
	bulkUnfavoriteModal: boolean
}) {
	const columnHelper = createColumnHelper<ContentListItem>()
	const { data: profile } = useQuery(trpc.user.getProfile.queryOptions())
	const data = favoriteContent.data ?? {
		content: [],
		role: "Employee" as EmployeeRole,
	}
	const [checkOutModalOpen, { open: openCheckOutModal, close: closeCheckOutModal }] =
		useDisclosure(false)
	const [checkInModalOpen, { open: openCheckInModal, close: closeCheckInModal }] =
		useDisclosure(false)
	const [contentSelectedForCheckout, selectContentForCheckout] = useState<ContentListItem | null>(
		null
	)

	const unfavoriteContent = useMutation(
		trpc.content.bulkUnFavorite.mutationOptions(mutationOptions)
	)

	const allTags = useMemo(
		() => [
			...new Map(
				data.content
					.flatMap((row) => row.tags)
					.map((t): [string, typeof t] => [`${t.category}-${t.name}`, t])
			).values(),
		],
		[data]
	)

	const columns = useMemo(
		() => [
			columnHelper.display({
				id: "checkbox",
				cell: ({ row }) => {
					return (
						<Checkbox
							aria-label="Select row"
							checked={row.getIsSelected()}
							onChange={row.getToggleSelectedHandler()}
						/>
					)
				},
			}),
			columnHelper.accessor((row) => `${contentStatusDisplayName[row.status]}`, {
				id: "status",
				header: "Status",
				enableSorting: false,
				cell: (info) => {
					return info.row.original.status === ContentStatus.Incomplete ? (
						<Tooltip withArrow arrowSize={8} label="Incomplete">
							<IconProgress size={20} />
						</Tooltip>
					) : info.row.original.status === ContentStatus.UnderReview ? (
						<Tooltip withArrow arrowSize={8} label="Under Review">
							<IconMessageCircleUser size={20} />
						</Tooltip>
					) : (
						<Tooltip withArrow arrowSize={8} label="Complete">
							<IconCircleCheck size={20} />
						</Tooltip>
					)
				},
			}),
			columnHelper.accessor((r) => `${r.title} ${r.type === "Link" ? r.url : ""}`, {
				id: "title",
				header: "Name",
				filterFn: "fuzzy",
				sortingFn: "fuzzy",
				enableSorting: true,
				cell: (info) => (
					<NameColumn info={info} openFilePreview={openFilePreviewModal} profile={profile} />
				),
			}),
			columnHelper.accessor((row) => `${row.owner.name} ${row.owner.email}`, {
				id: "owner",
				header: "Owner",
				filterFn: "fuzzy",
				sortingFn: "fuzzy",
				enableSorting: true,
				cell: (info) => <OwnerColumn info={info} />,
			}),
			columnHelper.accessor("lastModifiedDate", {
				id: "lastModified",
				header: () => <span className="min-w-max">Last Modified</span>,
				enableSorting: true,
				sortingFn: "datetime",
				cell: (info) => (
					<span title={info.getValue().toLocaleString()} className="w-40">
						{formatDate(info.getValue(), "MMM d yyyy")}
					</span>
				),
			}),
			columnHelper.accessor(
				(row) =>
					`${row.tags.map((t) => t.name).join(" ")} ${row.tags.filter((t) => t.category === TagCategory.IntendedAudience).map((t) => employeeRoleDisplayName[t.name as EmployeeRole])}`,
				{
					id: "tags",
					header: ({ column }) => <TagFilterPopup column={column} allTags={allTags} />,
					filterFn: "tagFilterFn",
					sortingFn: "fuzzy",
					enableSorting: false,
					cell: (info) => <TagColumn info={info} />,
				}
			),
			columnHelper.display({
				id: "actions",
				cell: (info) => (
					<ActionColumn
						info={info}
						selectContentForCheckout={selectContentForCheckout}
						openCheckOutModal={openCheckOutModal}
						openCheckInModal={openCheckInModal}
						profile={profile}
						showUnfavorite={true}
					/>
				),
			}),
		],
		[profile, allTags]
	)

	const table = useReactTable<ContentListItem>({
		data: data.content,
		columns: columns,
		initialState: {
			sorting: [
				{
					id: "title",
					desc: false,
				},
			],
		},
		state: {
			rowSelection,
		},
		enableSorting: true,
		enableRowSelection: true,
		sortingFns: {
			fuzzy: fuzzySort,
		},
		filterFns: {
			fuzzy: fuzzyFilter,
			tagFilterFn: tagFilterFn,
			checkedOutByFilterFn: checkedOutByFilterFn,
		},
		enableSortingRemoval: false,
		enableMultiSort: true,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onRowSelectionChange: setRowSelection,
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	})

	return (
		<div>
			<Table className="w-full">
				<Table.Thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<Table.Tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<Table.Th
									key={header.id}
									colSpan={header.colSpan}
									className={clsx(
										"text-left hover:underline w-max",
										header.column.getCanSort() ? "cursor-pointer select-none" : "",
										header.column.id === "actions" && "pl-0"
									)}
									onClick={header.column.getToggleSortingHandler()}
								>
									<Flex gap="sm">
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
										{header.column.id !== "favorited" &&
											(header.column.getIsSorted() === "asc" ? (
												<IconSortAscending2 className="inline shrink-0" size={20} />
											) : header.column.getIsSorted() === "desc" ? (
												<IconSortDescending2 className="inline shrink-0" size={20} />
											) : null)}
									</Flex>
								</Table.Th>
							))}
						</Table.Tr>
					))}
				</Table.Thead>
				<Table.Tbody>
					{table.getRowModel().rows.map((row) => {
						return (
							<Table.Tr
								key={row.id}
								className={clsx(
									"content-row",
									row.getIsSelected() && "bg-fuchsia-50 dark:bg-fuchsia-900/40"
								)}
							>
								{row.getVisibleCells().map((cell) => {
									return (
										<Table.Td
											key={cell.id}
											className={clsx(cell.column.id === "actions" && "pl-0")}
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</Table.Td>
									)
								})}
							</Table.Tr>
						)
					})}
					{table.getRowModel().rows.length === 0 && (
						<Table.Tr>
							<Table.Td colSpan={columns.length} className="py-4 text-center">
								<Text c="gray">Nothing found :(</Text>
							</Table.Td>
						</Table.Tr>
					)}
				</Table.Tbody>
			</Table>
			<CheckInModal
				opened={checkInModalOpen}
				onClose={closeCheckInModal}
				content={contentSelectedForCheckout}
			/>
			<CheckOutModal
				opened={checkOutModalOpen}
				onClose={closeCheckOutModal}
				content={contentSelectedForCheckout}
			/>
			<Modal
				opened={bulkUnfavoriteModal}
				onClose={closeBulkUnfavoriteModal}
				title="Confirm Unfavorite"
			>
				<Text>Are you sure you want to unfavorite the selected content?</Text>
				<Flex mt="md" justify="flex-end" gap="sm">
					<Button
						variant="subtle"
						color="gray"
						disabled={unfavoriteContent.isPending}
						onClick={closeBulkUnfavoriteModal}
					>
						Cancel
					</Button>
					<Button
						leftSection={<IconStarOff />}
						color="red"
						loading={unfavoriteContent.isPending}
						onClick={async () => {
							const idsToUnFavorite = table.getSelectedRowModel().rows.map((r) => r.original.id)
							await unfavoriteContent.mutateAsync(
								{ ids: idsToUnFavorite },
								{
									onSuccess: () => {
										table.resetRowSelection()
										table.setPageIndex(0)
										table.options.data = table.options.data.filter(
											(item) => !idsToUnFavorite.includes(item.id)
										)
										notifications.show({
											title: "Content unfavorited",
											message: "The selected content has been unfavorited successfully.",
											color: "emerald",
										})
										closeBulkUnfavoriteModal()
									},
								}
							)
						}}
					>
						Unfavorite
					</Button>
				</Flex>
			</Modal>
		</div>
	)
}

function CheckInModal({
	opened,
	onClose,
	content,
}: {
	opened: boolean
	onClose: () => void
	content: ContentListItem | null
}) {
	const checkInMutation = useMutation(trpc.content.checkIn.mutationOptions(mutationOptions))
	return (
		<Modal opened={opened} onClose={onClose} title="Confirm check in">
			<Text>
				Ready to check this content back in? Others will be able to edit it once it's checked in.
			</Text>
			<Flex gap="md" justify="flex-end" mt="md">
				<Button
					variant="subtle"
					color="gray"
					onClick={onClose}
					disabled={checkInMutation.isPending}
				>
					Cancel
				</Button>
				<Button
					loading={checkInMutation.isPending}
					onClick={async () => {
						if (content !== null) {
							await checkInMutation.mutateAsync({ id: content.id })
							onClose()
						}
					}}
					leftSection={<IconDoorEnter />}
				>
					Check in
				</Button>
			</Flex>
		</Modal>
	)
}

function CheckOutModal({
	opened,
	onClose,
	content,
}: {
	opened: boolean
	onClose: () => void
	content: ContentListItem | null
}) {
	const checkOutMutation = useMutation(trpc.content.checkOut.mutationOptions(mutationOptions))
	return (
		<Modal opened={opened} onClose={onClose} title="Confirm check out">
			<Text>Checking out this content will lock it out for editing by other users.</Text>
			<Flex gap="md" justify="flex-end" mt="md">
				<Button
					variant="subtle"
					color="gray"
					onClick={onClose}
					disabled={checkOutMutation.isPending}
				>
					Cancel
				</Button>
				<Button
					loading={checkOutMutation.isPending}
					onClick={async () => {
						if (content !== null) {
							await checkOutMutation.mutateAsync({ id: content.id })
							onClose()
						}
					}}
					leftSection={<IconDoorExit />}
				>
					Check out
				</Button>
			</Flex>
		</Modal>
	)
}
