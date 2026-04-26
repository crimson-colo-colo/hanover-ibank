import {
	ActionIcon,
	Button,
	Checkbox,
	Chip,
	Flex,
	Group,
	Kbd,
	Modal,
	NumberInput,
	Pagination,
	SegmentedControl,
	Select,
	Table,
	Text,
	TextInput,
	Title,
	Tooltip,
} from "@mantine/core"
import { useDebouncedValue, useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { ContentStatus, type EmployeeRole, TagCategory } from "@prisma/browser.ts"
import { ContentFilter } from "@shared/enum.ts"
import type { FileType } from "@shared/filetype.ts"
import type { ContentList, ContentListItem } from "@shared/types.ts"
import {
	IconCircleCheck,
	IconCloudUpload,
	IconDoorEnter,
	IconDoorExit,
	IconEye,
	IconHourglassEmpty,
	IconLoader2,
	IconMessageCircleUser,
	IconPencil,
	IconProgress,
	IconSortAscending2,
	IconSortDescending2,
	IconStar,
	IconStarFilled,
	IconTrash,
} from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table"
import clsx from "clsx"
import { formatDate, formatDistanceToNow } from "date-fns"
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react"
import { CreateContentModal } from "@/components/CreateContentModal.tsx"
import { TagFilterPopup } from "@/components/TagFilterPopup.tsx"
import {
	type ContentViews,
	contentStatusDisplayName,
	employeeRoleDisplayName,
} from "@/lib/enums.ts"
import {
	checkedOutByFilterFn,
	customFilterFunction,
	fuzzyFilter,
	fuzzySort,
	tagFilterFn,
} from "@/lib/table.ts"
import { queryClient, trpc } from "@/lib/trpc.ts"
import { ActionColumn } from "./ActionColumn.tsx"
import { NameColumn } from "./NameColumn.tsx"
import { OwnerColumn } from "./OwnerColumn.tsx"
import { TagColumn } from "./TagColumn.tsx"

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
	view: initialView,
}: {
	loading: boolean
	data: ContentList
	openFilePreview: (item: ContentListItem, type: FileType) => void
	filter: ContentFilter
	changeFilter: Dispatch<SetStateAction<ContentFilter>>
	view: ContentViews
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

	const defaultColumns = {
		checkbox: true,
		status: true,
		title: true,
		owner: true,
		lastModified: true,
		expirationDate: false,
		tags: true,
		actions: true,
		checkedOutBy: false,
	}

	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultColumns)
	const [sorting, setSorting] = useState<SortingState>([])

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
				cell: (info) => (
					<NameColumn info={info} openFilePreview={openFilePreview} profile={profile} />
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
			columnHelper.accessor("expirationDate", {
				id: "expirationDate",
				header: () => <span className="min-w-max">Expiration Date</span>,
				// size: 150,
				cell: (info) => (
					<span
						title={info.getValue().toLocaleString()}
						className={clsx("w-40", info.getValue().getTime() < Date.now() && "text-red-600")}
					>
						{formatDistanceToNow(info.getValue(), { addSuffix: true }).replace(
							/^(in )?about /,
							"$1"
						)}
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
					/>
				),
			}),
			columnHelper.accessor("checkedOutBy", {
				id: "checkedOutBy",
				header: "checkedOut?",
				enableSorting: false,
				cell: (info) => info.row.original.checkedOutBy?.name,
				filterFn: "checkedOutByFilterFn",
			}),
		],
		[profile, allTags]
	)

	const [pagination, setPagination] = useState({
		pageIndex: 0, //initial page index
		pageSize: 10, //default page size
	})

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
			pagination: {
				pageIndex: 0, //custom initial page index
				pageSize: 10, //custom default page size
			},
		},
		state: {
			rowSelection,
			pagination,
			globalFilter: debouncedGlobalFilter,
			columnVisibility,
			sorting,
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
			checkedOutByFilterFn: checkedOutByFilterFn,
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
		onColumnVisibilityChange: setColumnVisibility,
		onSortingChange: setSorting,
	})

	const [activeView, setActiveView] = useState<ContentViews>(initialView ?? "default")
	const navigate = useNavigate()

	useEffect(() => {
		navigate({
			from: "/content-table",
			search: (prev) => ({ ...prev, view: activeView }),
		})

		if (activeView === "default") {
			setSorting([{ id: "title", desc: false }])
			setColumnVisibility({
				...defaultColumns,
			})
			table.getColumn("checkedOutBy")?.setFilterValue(undefined)
		}

		if (activeView === "expiringSoon") {
			setSorting([{ id: "expirationDate", desc: false }])
			setColumnVisibility({
				...defaultColumns,
				lastModified: false,
				expirationDate: true,
			})
			table.getColumn("checkedOutBy")?.setFilterValue(undefined)
		}

		if (activeView === "recentlyViewed") {
			// TODO: this
		}

		if (activeView === "recentlyEdited") {
			// TODO: this
		}

		if (activeView === "checkedOut") {
			table.getColumn("checkedOutBy")?.setFilterValue("active")
			setColumnVisibility({
				...defaultColumns,
				lastModified: false,
			})
		}
	}, [activeView])

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
			<Chip.Group value={activeView} onChange={setActiveView}>
				<Group justify="left">
					<Chip
						icon={null}
						value="default"
						styles={{
							root: {
								padding: 0,
							},
							label: {
								padding: 15,
							},
						}}
					>
						Default
					</Chip>
					<Chip
						icon={null}
						value="expiringSoon"
						styles={{
							root: {
								padding: 0,
							},
							label: {
								padding: 15,
							},
						}}
					>
						<Group wrap="nowrap">
							<IconHourglassEmpty size="1rem" />
							Expiring Content
						</Group>
					</Chip>
					<Chip
						icon={null}
						value="recentlyViewed"
						styles={{
							root: {
								padding: 0,
							},
							label: {
								padding: 15,
							},
						}}
					>
						<Group wrap="nowrap">
							<IconEye size="1rem" />
							Recently Viewed
						</Group>
					</Chip>
					<Chip
						icon={null}
						value="recentlyEdited"
						styles={{
							root: {
								padding: 0,
							},
							label: {
								padding: 15,
							},
						}}
					>
						<Group wrap="nowrap">
							<IconPencil size="1rem" />
							Recently Edited
						</Group>
					</Chip>
					<Chip
						icon={null}
						value="checkedOut"
						styles={{
							root: {
								padding: 0,
							},
							label: {
								padding: 15,
							},
						}}
					>
						<Group wrap="nowrap">
							<IconDoorExit size="1rem" />
							Checked Out
						</Group>
					</Chip>
				</Group>
			</Chip.Group>
			<br />
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
						className="w-25"
						classNames={
							{
								// TODO: right align
								// input: "text-right",
							}
						}
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
