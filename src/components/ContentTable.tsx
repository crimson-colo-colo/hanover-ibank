import { UTCDate } from "@date-fns/utc"
import {
	ActionIcon,
	Anchor,
	Button,
	Checkbox,
	Flex,
	Group,
	Kbd,
	Modal,
	Table,
	Text,
	TextInput,
	Title,
	SegmentedControl,
} from "@mantine/core"
import { useDebouncedValue, useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { ContentFilter } from "@shared/enum.ts"
import { FileType } from "@shared/filetype.ts"
import {
	IconFilePencil,
	IconLoader2,
	IconPencil,
	IconSortAscending2,
	IconSortDescending2,
	IconStar,
	IconStarFilled,
	IconTrash,
} from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import clsx from "clsx"
import { formatDistanceToNow } from "date-fns"
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react"
import { Avatar } from "@/components/Avatar.tsx"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { formatBytes } from "@/lib/content.ts"
import { fuzzyFilter, fuzzySort } from "@/lib/table.ts"
import { queryClient, trpc, trpcClient } from "@/lib/trpc.ts"
import type { ContentList, ContentListItem } from "../../server/routers/content.ts"

export function ContentTable({
	data,
	openEditDialog,
	openFileEditDialog,
	filter,
	changeFilter,
}: {
	data: ContentList
	openEditDialog: (item: ContentListItem) => void
	openFileEditDialog: (item: ContentListItem) => void
	filter: ContentFilter
	changeFilter: Dispatch<SetStateAction<ContentFilter>>
}) {
	const columnHelper = createColumnHelper<ContentListItem>()
	const [rowSelection, setRowSelection] = useState({})
	const [globalFilter, setGlobalFilter] = useState("")
	const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null)
	const [deleteDialogOpen, { open: openDeleteDialog, close: closeDeleteDialog }] =
		useDisclosure(false)
	const deleteContent = useMutation(
		trpc.content.delete.mutationOptions({
			onMutate: async (data, context) => {
				const listContent = trpc.content.list.queryKey()
				await context.client.cancelQueries({ queryKey: listContent })
				const previousContent = context.client.getQueryData(listContent)
				context.client.setQueryData(listContent, (old) => ({
					...old!,
					content: old!.content.filter((item) => !data.ids.includes(item.id)) ?? [],
				}))
				return { previousContent }
			},
			onError: (err, data, onMutateResult, context) => {
				if (onMutateResult) {
					context.client.setQueryData(trpc.content.list.queryKey(), onMutateResult.previousContent)
				}
			},
			onSettled() {
				queryClient.invalidateQueries({ queryKey: trpc.content.list.queryKey() })
				queryClient.invalidateQueries({ queryKey: trpc.content.listFavorites.queryKey() })
			},
		})
	)
	const favoriteContent = useMutation(
		trpc.content.favorite.mutationOptions({
			onMutate: async (data, context) => {
				const listContent = trpc.content.list.queryKey()
				await context.client.cancelQueries({ queryKey: listContent })
				const previousContent = context.client.getQueryData(listContent)
				context.client.setQueryData(listContent, (old) => ({
					...old!,
					content:
						old!.content.map((item) =>
							item.id === data.id ? { ...item, favorited: true } : item
						) ?? [],
				}))
				return { previousContent }
			},
			onSettled() {
				queryClient.invalidateQueries({ queryKey: trpc.content.list.queryKey() })
				queryClient.invalidateQueries({ queryKey: trpc.content.listFavorites.queryKey() })
			},
		})
	)
	const unfavoriteContent = useMutation(
		trpc.content.unfavorite.mutationOptions({
			onMutate: async (data, context) => {
				const listContent = trpc.content.list.queryKey()
				await context.client.cancelQueries({ queryKey: listContent })
				const previousContent = context.client.getQueryData(listContent)
				context.client.setQueryData(listContent, (old) => ({
					...old!,
					content:
						old!.content.map((item) =>
							item.id === data.id ? { ...item, favorited: false } : item
						) ?? [],
				}))
				return { previousContent }
			},
			onSettled() {
				queryClient.invalidateQueries({ queryKey: trpc.content.list.queryKey() })
				queryClient.invalidateQueries({ queryKey: trpc.content.listFavorites.queryKey() })
			},
		})
	)

	const [debouncedGlobalFilter] = useDebouncedValue(globalFilter, 250)

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
						onClick={async (e) => {
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
			columnHelper.accessor("title", {
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
									c="black"
									className="font-semibold m-0 truncate max-w-[30ch]"
									title={item.title}
									href={item.url}
								>
									{item.title}
								</Anchor>
								<span className="ml-2 text-xs text-gray-500 truncate" title={item.url}>
									{host.replace(/^www\./, "")}
								</span>
							</div>
						)
					} else {
						const size = formatBytes(
							data.objectMetadata.get(info.row.original.id)?.ContentLength ?? 0
						)
						const fileType = data.objectMetadata.get(info.row.original.id)?.Metadata?.filetype as
							| FileType
							| undefined
						return (
							<div className="flex items-center gap-2">
								{downloadingItemId === item.id ? (
									<IconLoader2 className="shrink-0 animate-spin" stroke={2} />
								) : (
									<FileTypeIcon
										fileType={fileType ?? FileType.Unknown}
										size={22}
										strokeWidth={1.5}
									/>
								)}
								<button
									className="font-semibold m-0 truncate max-w-[30ch] hover:underline p-0 border-none bg-transparent text-base cursor-pointer"
									title={item.title}
									onClick={async () => {
										setDownloadingItemId(item.id)
										try {
											const { url } = await trpcClient.content.download.query({ id: item.id })
											window.open(url, "_blank")
										} finally {
											setDownloadingItemId(null)
										}
									}}
								>
									{item.title}
								</button>
								<span className="ml-2 text-xs text-gray-500 truncate" title={size}>
									{size}
								</span>
							</div>
						)
					}
				},
			}),
			columnHelper.accessor("owner", {
				header: "Owner",
				filterFn: fuzzyFilter,
				enableSorting: true,
				sortingFn: (a, b) => a.original.owner.name.localeCompare(b.original.owner.name),
				cell: (info) => (
					<div className="flex items-center gap-2">
						<Avatar
							userId={info.getValue().id}
							alt={info.getValue().name}
							width={24}
							height={24}
							radius="100%"
							className="shrink-0 w-6 h-6"
						/>
						<span className="truncate" title={info.getValue().email}>
							{info.getValue().name}
						</span>
					</div>
				),
			}),
			columnHelper.accessor("lastModifiedDate", {
				header: "Last Modified",
				enableSorting: true,
				sortingFn: "datetime",
				cell: (info) => (
					<span title={new UTCDate(info.getValue()).toLocaleString()}>
						{formatDistanceToNow(new UTCDate(info.getValue()), { addSuffix: true })}
					</span>
				),
			}),
			columnHelper.accessor("expirationDate", {
				header: "Expiration Date",
				enableSorting: true,
				sortingFn: "datetime",
				cell: (info) => (
					<span title={new UTCDate(info.getValue()).toLocaleString()}>
						{formatDistanceToNow(new UTCDate(info.getValue()), { addSuffix: true })}
					</span>
				),
			}),
			columnHelper.display({
				id: "actions",
				cell: (info) => (
					<Flex className="content-actions" gap="2px" justify="flex-end">
						<ActionIcon
							variant="transparent"
							size="sm"
							onClick={(e) => {
								openEditDialog(info.row.original)
							}}
						>
							<IconPencil />
						</ActionIcon>
						{info.row.original.type === "Object" && (
							<ActionIcon
								variant="transparent"
								size="sm"
								onClick={(e) => {
									openFileEditDialog(info.row.original)
								}}
							>
								<IconFilePencil />
							</ActionIcon>
						)}
					</Flex>
				),
			}),
		],
		[]
	)

	const table = useReactTable({
		data: data.content,
		columns: columns,
		state: {
			rowSelection,
			globalFilter: debouncedGlobalFilter,
		},
		enableGlobalFilter: true,
		enableSorting: true,
		enableRowSelection: true,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: fuzzyFilter,
		sortingFns: {
			fuzzy: fuzzySort,
		},
		filterFns: {
			fuzzy: fuzzyFilter,
		},
		initialState: {
			sorting: [
				{
					id: "title",
					desc: false,
				},
			],
		},
		enableSortingRemoval: false,
		enableMultiSort: true,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onRowSelectionChange: setRowSelection,
		getFilteredRowModel: getFilteredRowModel(),
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
				<Title order={3}>Your Content ({data.content.length})</Title>

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
								bg={row.getIsSelected() ? "fuchsia.0" : undefined}
								className="content-row"
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
							<Table.Td colSpan={columns.length} className="text-center py-4">
								<Text c="gray">Nothing found :(</Text>
							</Table.Td>
						</Table.Tr>
					)}
				</Table.Tbody>
			</Table>
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
						onClick={() => {
							const idsToDelete = table.getSelectedRowModel().rows.map((r) => r.original.id)
							deleteContent.mutate(
								{ ids: idsToDelete },
								{
									onSuccess: () => {
										table.resetRowSelection()
										table.setPageIndex(0)
										table.options.data = table.options.data.filter(
											(item) => !idsToDelete.includes(item.id)
										)
										queryClient.invalidateQueries({ queryKey: trpc.content.list.queryKey() })
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
		</>
	)
}
