import { UTCDate } from "@date-fns/utc"
import {
	ActionIcon,
	Anchor,
	Checkbox,
	Flex,
	Group,
	Image,
	Kbd,
	Table,
	Text,
	TextInput,
} from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import {
	IconFile,
	IconFilePencil,
	IconLink,
	IconLoader2,
	IconPencil,
	IconSortAscending2,
	IconSortDescending2,
} from "@tabler/icons-react"
import { compareItems, type RankingInfo, rankItem } from "@tanstack/match-sorter-utils"
import {
	createColumnHelper,
	type FilterFn,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingFn,
	sortingFns,
	useReactTable,
} from "@tanstack/react-table"
import clsx from "clsx"
import { formatDistanceToNow } from "date-fns"
import { useMemo, useState } from "react"
import { formatBytes } from "@/lib/content.ts"
import { trpcClient } from "@/lib/trpc.ts"
import type { ContentList, ContentListItem } from "../../server/routers/content.ts"

declare module "@tanstack/react-table" {
	//add fuzzy filter to the filterFns
	interface FilterFns {
		fuzzy: FilterFn<unknown>
	}
	interface FilterMeta {
		itemRank: RankingInfo
	}
}

const fuzzyFilter: FilterFn<ContentListItem> = (row, columnId, value, addMeta) => {
	const itemRank = rankItem(row.getValue(columnId), value)
	addMeta({ itemRank })
	return itemRank.passed
}

const fuzzySort: SortingFn<ContentListItem> = (rowA, rowB, columnId) => {
	let dir = 0

	if (rowA.columnFiltersMeta[columnId]) {
		dir = compareItems(
			rowA.columnFiltersMeta[columnId].itemRank!,
			rowB.columnFiltersMeta[columnId].itemRank!
		)
	}

	return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}

export function ContentTable({
	data,
	openEditDialog,
	openFileEditDialog,
}: {
	data: ContentList
	openEditDialog: (item: ContentListItem) => void
	openFileEditDialog: (item: ContentListItem) => void
}) {
	const columnHelper = createColumnHelper<ContentListItem>()
	const [rowSelection, setRowSelection] = useState({})
	const [globalFilter, setGlobalFilter] = useState("")
	const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null)

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
			columnHelper.accessor("title", {
				header: "Name",
				filterFn: fuzzyFilter,
				sortingFn: fuzzySort,
				enableSorting: true,
				cell: (info) => {
					const item = info.row.original
					if (item.type === "Link") {
						const host = new URL(item.url).hostname
						return (
							<div className="flex items-center gap-2">
								<IconLink className="shrink-0" stroke={1.5} />
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
						const size = formatBytes(data.objectMetadata.get(info.row.original.id)?.size ?? 0)
						return (
							<div className="flex items-center gap-2">
								{downloadingItemId === item.id ? (
									<IconLoader2 className="shrink-0 animate-spin" stroke={1.5} />
								) : (
									<IconFile className="shrink-0" stroke={1.5} />
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
						<Image
							src={info.getValue().avatarUrl}
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
					<>
						<ActionIcon
							variant="white"
							size="sm"
							onClick={(e) => {
								openEditDialog(info.row.original)
							}}
						>
							<IconPencil />
						</ActionIcon>
						{info.row.original.type === "Object" && (
							<ActionIcon
								variant="white"
								size="sm"
								onClick={(e) => {
									openFileEditDialog(info.row.original)
								}}
							>
								<IconFilePencil />
							</ActionIcon>
						)}
					</>
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
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onRowSelectionChange: setRowSelection,
		getFilteredRowModel: getFilteredRowModel(),
	})

	return (
		<>
			<Flex align="center" justify="space-between" gap="md">
				<h2 className="mt-6 mb-4 text-xl font-semibold">Content</h2>

				<TextInput
					className="flex-1 max-w-100"
					value={globalFilter ?? ""}
					onChange={(value) => setGlobalFilter(value.currentTarget.value)}
					placeholder="Search..."
					rightSection={
						<Flex gap={4} mr={32}>
							<Kbd size="xs">Ctrl</Kbd> <Kbd size="xs">K</Kbd>
						</Flex>
					}
				/>
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
										{header.column.getIsSorted() === "asc" ? (
											<IconSortAscending2 className="inline" size={20} />
										) : header.column.getIsSorted() === "desc" ? (
											<IconSortDescending2 className="inline" size={20} />
										) : null}
									</Group>
								</Table.Th>
							))}
						</Table.Tr>
					))}
				</Table.Thead>
				<Table.Tbody>
					{table.getRowModel().rows.map((row) => {
						return (
							<Table.Tr key={row.id}>
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
		</>
	)
}
