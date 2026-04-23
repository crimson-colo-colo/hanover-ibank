import {
	ActionIcon,
	Anchor,
	Button,
	Checkbox,
	Flex,
	Group,
	HoverCard,
	Image,
	Kbd,
	Menu,
	Modal,
	NumberInput,
	Pagination,
	Pill,
	SegmentedControl,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
	Title,
	Tooltip,
} from "@mantine/core"
import { useDebouncedValue, useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { ContentStatus, ContentType, type EmployeeRole, TagCategory } from "@prisma/browser.ts"
import { ContentFilter } from "@shared/enum.ts"
import { FileType } from "@shared/filetype.ts"
import type { ContentList, ContentListItem } from "@shared/types.ts"
import {
	IconCircleArrowUpRight,
	IconCircleCheck,
	IconCloudUpload,
	IconDoorEnter,
	IconDoorExit,
	IconDotsVertical,
	IconDownload,
	IconLoader2,
	IconMessageCircleUser,
	IconPencilCheck,
	IconPencilOff,
	IconProgress,
	IconSortAscending2,
	IconSortDescending2,
	IconStar,
	IconStarFilled,
	IconTrash,
} from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type Row,
	useReactTable,
} from "@tanstack/react-table"
import clsx from "clsx"
import { formatDate } from "date-fns"
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react"
import { Avatar } from "@/components/Avatar.tsx"
import { CreateContentModal } from "@/components/CreateContentModal.tsx"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { TagFilterPopup } from "@/components/TagFilterPopup.tsx"
import { formatBytes } from "@/lib/content.ts"
import {
	contentStatusDisplayName,
	employeeRoleDisplayName,
	tagCategoryDisplayName,
} from "@/lib/enums.ts"
import { fuzzyFilter, fuzzySort, tagFilterFn } from "@/lib/table.ts"
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

export function ContentTable({
	loading,
	data,
	openFilePreview,
	filter,
	changeFilter,
}: {
	loading: boolean
	data: ContentList
	openFilePreview: (item: ContentListItem, type: FileType) => void
	filter: ContentFilter
	changeFilter: Dispatch<SetStateAction<ContentFilter>>
}) {
	const columnHelper = createColumnHelper<ContentListItem>()
	const [rowSelection, setRowSelection] = useState({})
	const [globalFilter, setGlobalFilter] = useState("")
	const [deleteDialogOpen, { open: openDeleteDialog, close: closeDeleteDialog }] =
		useDisclosure(false)
	const [createModalOpen, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false)
	const deleteContent = useMutation(trpc.content.delete.mutationOptions(mutationOptions))
	const favoriteContent = useMutation(trpc.content.favorite.mutationOptions(mutationOptions))
	const unfavoriteContent = useMutation(trpc.content.unfavorite.mutationOptions(mutationOptions))

	const [debouncedGlobalFilter] = useDebouncedValue(globalFilter, 250)

	const { data: profile } = useQuery(trpc.user.getProfile.queryOptions())
	const [checkOutModalOpen, { open: openCheckOutModal, close: closeCheckOutModal }] =
		useDisclosure(false)
	const [checkInModalOpen, { open: openCheckInModal, close: closeCheckInModal }] =
		useDisclosure(false)
	const [contentSelectedForCheckout, selectContentForCheckout] = useState<ContentListItem | null>(
		null
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
			columnHelper.accessor("favorited", {
				header: (info) =>
					info.column.getIsSorted() === "asc" ? (
						<IconStar size={20} />
					) : info.column.getIsSorted() === "desc" ? (
						<IconStarFilled className="fill-[#f8de1f]" size={20} />
					) : (
						<IconStarFilled size={20} />
					),
				cell: (info) => (
					<ActionIcon
						size="sm"
						onClick={async () => {
							if (!info.getValue()) {
								await favoriteContent.mutateAsync({ id: info.row.original.id })
							} else {
								await unfavoriteContent.mutateAsync({ id: info.row.original.id })
							}
						}}
						variant="transparent"
					>
						{favoriteContent.isPending || unfavoriteContent.isPending ? (
							<IconLoader2 className="animate-spin" />
						) : info.getValue() ? (
							<IconStarFilled className="fill-[#f8de1f] content-favorite stroke-2 hover:stroke-black stroke-transparent" />
						) : (
							<IconStar className="content-not-favorite" />
						)}
					</ActionIcon>
				),
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
				cell: (info) => {
					const item = info.row.original
					if (item.type === "Link") {
						const host = new URL(item.url).hostname
						return (
							<div className="flex items-center gap-2">
								<FileTypeIcon fileType={FileType.Link} size={22} strokeWidth={1.5} />
								<Anchor
									c="var(--mantine-color-bright)"
									className="font-semibold m-0 truncate max-w-[30ch]"
									title={item.title}
									onClick={async () => {
										openFilePreview(item, FileType.Link)
									}}
								>
									{item.title}
								</Anchor>
								<span className="ml-2 text-xs text-gray-500 truncate" title={item.url}>
									{host.replace(/^www\./, "")}
								</span>
								{info.row.original.checkedOutBy !== null &&
									(info.row.original.checkedOutBy.id === profile?.id ? (
										<Tooltip withArrow arrowSize={8} label="You have this link checked out">
											<IconPencilCheck size={24} />
										</Tooltip>
									) : (
										<Tooltip
											withArrow
											arrowSize={8}
											label={`Checked out by ${info.row.original.checkedOutBy.name}`}
										>
											link
											<IconPencilOff className="checked-out-icon" size={24} />
										</Tooltip>
									))}
							</div>
						)
					} else if (item.type === "Object") {
						const size = formatBytes(item.object.ContentLength ?? 0)
						const fileType = item.object.Metadata?.filetype as FileType | undefined
						return (
							<div className="flex items-center gap-2">
								<FileTypeIcon fileType={fileType ?? FileType.Unknown} size={22} strokeWidth={1.5} />
								<button
									className="font-semibold m-0 truncate max-w-[30ch] hover:underline p-0 border-none bg-transparent text-base cursor-pointer"
									title={item.title}
									onClick={async () => {
										openFilePreview(item, fileType ?? FileType.Unknown)
									}}
								>
									{item.title}
								</button>
								<span className="ml-2 text-xs text-gray-500 truncate" title={size}>
									{size}
								</span>
								{info.row.original.checkedOutBy !== null &&
									(info.row.original.checkedOutBy.id === profile?.id ? (
										<Tooltip withArrow arrowSize={8} label="You have this file checked out">
											<IconPencilCheck size={24} />
										</Tooltip>
									) : (
										<Tooltip
											withArrow
											arrowSize={8}
											label={`Checked out by ${info.row.original.checkedOutBy.name}`}
										>
											<IconPencilOff className="checked-out-icon" size={24} />
										</Tooltip>
									))}
							</div>
						)
					}
				},
			}),
			columnHelper.accessor((row) => `${row.owner.name} ${row.owner.email}`, {
				id: "owner",
				header: "Owner",
				filterFn: "fuzzy",
				sortingFn: "fuzzy",
				enableSorting: true,
				cell: (info) => (
					<HoverCard openDelay={250} withArrow>
						<HoverCard.Target>
							<Avatar
								userId={info.row.original.owner.id}
								alt={info.row.original.owner.name}
								width={24}
								height={24}
								radius="100%"
								className="w-6 h-6 shrink-0"
							/>
						</HoverCard.Target>
						<HoverCard.Dropdown className="shadow-sm">
							<Flex gap="md">
								<Image src={`/avatar/${info.row.original.owner.id}`} radius="100%" h={40} w={40} />
								<Stack gap={0} justify="center">
									<Text size="sm" fw={500}>
										{info.row.original.owner.name}
									</Text>
									<Text size="xs" c="gray">
										{info.row.original.owner.email} ·{" "}
										{employeeRoleDisplayName[info.row.original.owner.role]}
									</Text>
								</Stack>
							</Flex>
						</HoverCard.Dropdown>
					</HoverCard>
				),
			}),
			columnHelper.accessor("lastModifiedDate", {
				header: "Last Modified",
				enableSorting: true,
				sortingFn: "datetime",
				cell: (info) => (
					<span title={info.getValue().toLocaleString()}>
						{info.getValue().getFullYear() === new Date().getFullYear()
							? formatDate(info.getValue(), "MMM d")
							: formatDate(info.getValue(), "MMM d yyyy")}
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
					cell: (info) => (
						<Group gap={4}>
							{info.row.original.tags.map((tag) => (
								<Tooltip
									withArrow
									arrowSize={8}
									key={`${tag.category}-${tag.name}`}
									label={`${tagCategoryDisplayName[tag.category]}: ${
										tag.category === TagCategory.IntendedAudience
											? employeeRoleDisplayName[tag.name as EmployeeRole]
											: tag.name
									}`}
								>
									<Pill key={`${tag.category}-${tag.name}`} size="xs" color="gray">
										{tag.category === TagCategory.IntendedAudience
											? employeeRoleDisplayName[tag.name as EmployeeRole]
											: tag.name}
									</Pill>
								</Tooltip>
							))}
						</Group>
					),
				}
			),
			columnHelper.display({
				id: "actions",
				cell: (info) => (
					<Flex className="content-actions" gap="2px" justify="flex-end">
						{info.row.original.type === "Link" ? (
							<ActionIcon
								variant="subtle"
								size="sm"
								onClick={() => {
									if (info.row.original.type === ContentType.Link) {
										window.open(info.row.original.url)
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
						<Menu width={140} closeOnItemClick={true} position="bottom-end">
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
										onClick={() => {
											if (info.row.original.type === ContentType.Link) {
												window.open(info.row.original.url)
											}
										}}
									>
										Open link
									</Menu.Item>
								)}
								{info.row.original.checkedOutBy === null ? (
									<Menu.Item
										leftSection={<IconDoorExit size={22} />}
										variant="subtle"
										onClick={() => {
											selectContentForCheckout(info.row.original)
											openCheckOutModal()
										}}
									>
										Check Out
									</Menu.Item>
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
									<Menu.Item leftSection={<IconDoorExit size={22} />} variant="subtle" disabled>
										Check Out
									</Menu.Item>
								)}
							</Menu.Dropdown>
						</Menu>
					</Flex>
				),
			}),
		],
		[profile, allTags]
	)

	const customFilterFunction = (
		row: Row<ContentListItem>,
		columnId: string,
		filterValue: string
	) => {
		const value = row.getValue(columnId)
		//Just for status column use equals logic
		if (columnId === "status") {
			return value?.toString().toLowerCase() === filterValue.toLowerCase()
		}
		//For all other columns use fuzzier includes logic
		return value?.toString().toLowerCase().includes(filterValue.toLowerCase()) ?? false
	}
	const [pagination, setPagination] = useState({
		pageIndex: 0, //initial page index
		pageSize: 10, //default page size
	})

	const table = useReactTable<ContentListItem>({
		data: data.content,
		columns: columns,
		state: {
			rowSelection,
			pagination,
			globalFilter: debouncedGlobalFilter,
		},
		enableGlobalFilter: true,
		enableSorting: true,
		enableRowSelection: true,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: customFilterFunction,
		sortingFns: {
			fuzzy: fuzzySort,
		},
		filterFns: {
			fuzzy: fuzzyFilter,
			tagFilterFn: tagFilterFn,
		},
		initialState: {
			sorting: [
				{
					id: "title",
					desc: false,
				},
			],
			pagination: {
				pageIndex: 0, //custom initial page index
				pageSize: 10, //custom default page size
			},
		},
		enableSortingRemoval: false,
		enableMultiSort: true,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onRowSelectionChange: setRowSelection,
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		autoResetPageIndex: false,
	})

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
				e.preventDefault()
				const searchInput = document.getElementById("content-search-input")
				if (searchInput) {
					searchInput.focus()
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [])

	return (
		<>
			<Flex align="center" justify="space-between" gap="md" mt="xl" mb="sm">
				<Title order={3} className="flex items-center gap-4">
					<span>Your Content ({table.getRowCount()})</span>
					{loading && <IconLoader2 size={20} className="animate-spin" />}
				</Title>

				<Flex gap="sm">
					<SegmentedControl
						data={[
							{ label: "For You", value: ContentFilter.Own },
							{ label: "Show All", value: ContentFilter.All },
						]}
						value={filter}
						onChange={changeFilter}
					/>

					<Button
						leftSection={<IconCloudUpload size={16} stroke={1.5} />}
						onClick={openCreateModal}
					>
						Upload content
					</Button>

					<Button
						leftSection={<IconTrash />}
						variant="subtle"
						disabled={Object.keys(rowSelection).length === 0}
						color="red"
						onClick={() => {
							openDeleteDialog()
						}}
					>
						Delete selected
					</Button>
					<TextInput
						className="grow max-w-120"
						value={globalFilter ?? ""}
						onChange={(value) => setGlobalFilter(value.currentTarget.value)}
						placeholder="Search..."
						rightSection={
							<Flex gap={4} mr={32}>
								<Kbd size="xs">Ctrl</Kbd> <Kbd size="xs">K</Kbd>
							</Flex>
						}
						id="content-search-input"
					/>
				</Flex>
			</Flex>
			<Table>
				<Table.Thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<Table.Tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<Table.Th
									key={header.id}
									colSpan={header.colSpan}
									className={clsx(
										header.column.getCanSort() ? "cursor-pointer select-none" : "",
										"text-left hover:underline"
									)}
									onClick={header.column.getToggleSortingHandler()}
								>
									<Group gap="sm">
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
										{header.column.id !== "favorited" &&
											(header.column.getIsSorted() === "asc" ? (
												<IconSortAscending2 className="inline" size={20} />
											) : header.column.getIsSorted() === "desc" ? (
												<IconSortDescending2 className="inline" size={20} />
											) : null)}
									</Group>
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
										<Table.Td key={cell.id}>
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
			<CreateContentModal opened={createModalOpen} onClose={closeCreateModal} />
			<Modal opened={deleteDialogOpen} onClose={closeDeleteDialog} title="Confirm Deletion">
				<Text>Are you sure you want to delete the selected content?</Text>
				<Flex mt="md" justify="flex-end" gap="sm">
					<Button
						variant="subtle"
						color="gray"
						disabled={deleteContent.isPending}
						onClick={closeDeleteDialog}
					>
						Cancel
					</Button>
					<Button
						color="red"
						loading={deleteContent.isPending}
						onClick={async () => {
							const idsToDelete = table.getSelectedRowModel().rows.map((r) => r.original.id)
							await deleteContent.mutateAsync(
								{ ids: idsToDelete },
								{
									onSuccess: () => {
										table.resetRowSelection()
										table.setPageIndex(0)
										table.options.data = table.options.data.filter(
											(item) => !idsToDelete.includes(item.id)
										)
										notifications.show({
											title: "Content deleted",
											message: "The selected content has been deleted successfully.",
											color: "emerald",
										})
										closeDeleteDialog()
									},
								}
							)
						}}
					>
						Delete
					</Button>
				</Flex>
			</Modal>
			<Flex justify="space-between" direction="row" align="center" mt="md">
				<Group>
					<Pagination.Root
						siblings={1}
						boundaries={1}
						defaultValue={table.getState().pagination.pageIndex}
						total={table.getPageCount()}
						value={table.getState().pagination.pageIndex + 1}
						onChange={(newPage) => {
							table.setPageIndex(newPage - 1)
						}}
					>
						<Group gap={3} justify="center">
							<Pagination.First />
							<Pagination.Previous />
							<Pagination.Items />
							<Pagination.Next />
							<Pagination.Last />
						</Group>
					</Pagination.Root>

					<Text size="sm">Go to page:</Text>
					<NumberInput
						w={70}
						placeholder="0"
						defaultValue={table.getState().pagination.pageIndex}
						value={table.getState().pagination.pageIndex + 1}
						onChange={(value) => {
							if (value === "" || value === null) return
							const page = Number(value) - 1
							if (page >= 0 && page < table.getPageCount()) {
								table.setPageIndex(page)
							}
						}}
						min={1}
						max={table.getPageCount()}
					/>
				</Group>
				<Group gap="xs" align="center">
					<Text>Items per page:</Text>
					<Select
						size="sm"
						value={table.getState().pagination.pageSize}
						onChange={(value) => {
							value && table.setPageSize(Number(value))
						}}
						data={[10, 20, 30, 40, 50]}
						defaultValue={table.getState().pagination.pageSize}
					></Select>
				</Group>
			</Flex>
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
		</>
	)

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
}
