import {
	ActionIcon,
	Flex,
	Group,
	NumberInput,
	Pagination,
	Select,
	Table,
	Text,
	Title,
	Tooltip,
} from "@mantine/core"
import { activityLabelToStringTable } from "@shared/activityLabels.ts"
import {
	IconCircleArrowUpRight,
	IconSearch,
	IconSortAscending2,
	IconSortDescending2,
} from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import clsx from "clsx"
import { formatDate, formatDistanceToNow } from "date-fns"
import { useCallback, useMemo, useRef, useState } from "react"
import { Avatar } from "@/components/Avatar.tsx"
import { EmployeeSearch } from "@/components/EmployeeSearch.tsx"
import { checkedOutByFilterFn, fuzzyFilter, fuzzySort, tagFilterFn } from "@/lib/table.ts"
import { trpc } from "@/lib/trpc.ts"

export const Route = createFileRoute("/admin/activity-log")({
	component: RouteComponent,
})

function RouteComponent() {
	const [employeeId, setEmployeeID] = useState<string | undefined>(undefined)
	const [searching, setSearching] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const [pagination, setPagination] = useState({
		pageIndex: 0, //initial page index
		pageSize: 20, //default page size
	})

	const allLogs = useQuery(
		trpc.activityLogging.listUserActivity.queryOptions({
			employeeId: employeeId,
			limit: Number.MAX_SAFE_INTEGER,
		})
	)

	const columnHelper = createColumnHelper<NonNullable<(typeof allLogs)["data"]>[number]>()

	const columns = useMemo(
		() => [
			columnHelper.accessor((row) => `${row.employeeId}`, {
				id: "employee",
				header: "Employee",
				filterFn: "fuzzy",
				enableSorting: true,
				cell: (info) => (
					<Group gap={8}>
						<Avatar
							userId={info.row.original.employeeId}
							alt={info.row.original.displayName}
							width={24}
							height={24}
							radius="100%"
							className="w-6 h-6 shrink-0"
						/>
						<Text>{info.row.original.displayName}</Text>
					</Group>
				),
			}),
			columnHelper.accessor("action", {
				id: "action",
				header: "Action",
				enableSorting: false,
				cell: (info) => <Text>{activityLabelToStringTable[info.getValue()]}</Text>,
			}),
			columnHelper.accessor("contentTitle", {
				id: "contentTitle",
				header: "Content",
				enableSorting: true,
				cell: (info) =>
					info.row.original.contentId ? (
						<Link
							to="/preview/$contentId"
							params={{ contentId: info.row.original.contentId }}
							className="no-underline text-current hover:underline text-base flex gap-2 items-center"
						>
							{info.getValue()}
							<IconCircleArrowUpRight size={16} className="shrink-0" strokeWidth={1.5} />
						</Link>
					) : (
						<Tooltip label="Content no longer exists" withArrow arrowSize={8} position="top">
							<Text className="text-base w-max text-dimmed">{info.getValue()}</Text>
						</Tooltip>
					),
			}),
			columnHelper.accessor("timestamp", {
				id: "timestamp",
				header: "Time",
				enableSorting: true,
				cell: (info) => {
					const date = info.getValue()
					if (Date.now() - new Date(date).getTime() < 1000 * 60 * 60 * 24) {
						return (
							<Tooltip label={formatDate(date, "PPPpp")} withArrow arrowSize={8} position="top">
								<Text className="w-max">{formatDistanceToNow(date, { addSuffix: true })}</Text>
							</Tooltip>
						)
					}
					return <Text>{formatDate(date, "PPPpp")}</Text>
				},
			}),
		],
		[]
	)

	const table = useReactTable({
		data: allLogs.data ?? [],
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		autoResetPageIndex: false,
		filterFns: {
			fuzzy: fuzzyFilter,
			tagFilterFn: tagFilterFn,
			checkedOutByFilterFn: checkedOutByFilterFn,
		},
		sortingFns: {
			fuzzy: fuzzySort,
		},
		initialState: {
			sorting: [{ id: "timestamp", desc: true }],
			pagination: {
				pageIndex: 0, //custom initial page index
				pageSize: 20, //custom default page size
			},
		},
		state: {
			pagination,
		},
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		getFilteredRowModel: getFilteredRowModel(),
	})

	const pageCount = table.getPageCount()
	const pageValue = table.getState().pagination.pageIndex + 1
	const hasPages = pageCount > 0

	const rows = table.getRowModel().rows.map((row) => (
		<Table.Tr key={row.id} bg={row.getIsSelected() ? "fuchsia.0" : undefined}>
			{row.getVisibleCells().map((cell) => (
				<Table.Td key={cell.id}>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</Table.Td>
			))}
		</Table.Tr>
	))

	const setFilter = useCallback((val: string | undefined) => {
		// table.getColumn("employee")?.setFilterValue(val)
		setEmployeeID((prev) => (prev === val ? prev : val))
		setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }))
	}, [])

	return (
		<div>
			<Group mb="md">
				<Title order={2}>Activity Logs ({table.getRowCount()})</Title>
				{searching ? (
					<EmployeeSearch onSubmit={setFilter} setSearching={setSearching} inputRef={inputRef} />
				) : (
					<ActionIcon
						variant="subtle"
						onClick={() => {
							setSearching(!searching)
						}}
					>
						<IconSearch size={22} />
					</ActionIcon>
				)}
			</Group>
			<Table>
				<Table.Thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<Table.Tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<Table.Th
									key={header.id}
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
				<Table.Tbody>{rows}</Table.Tbody>
			</Table>
			<Flex justify="space-between" direction="row" align="center" mt="md">
				<Group>
					<Pagination.Root
						siblings={1}
						boundaries={1}
						total={hasPages ? pageCount : 1}
						value={hasPages ? pageValue : 1}
						onChange={(newPage) => {
							if (!hasPages) return
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
						value={hasPages ? pageValue : 1}
						onChange={(value) => {
							if (value === "" || value === null) return
							if (!hasPages) return
							const page = Number(value) - 1
							if (page >= 0 && page < pageCount) {
								table.setPageIndex(page)
							}
						}}
						min={1}
						max={hasPages ? pageCount : 1}
					/>
				</Group>
				<Group gap="xs" align="center">
					<Text>Items per page:</Text>
					<Select
						w={70}
						size="sm"
						value={String(table.getState().pagination.pageSize)}
						onChange={(value) => {
							value && table.setPageSize(Number(value))
						}}
						data={["10", "20", "30", "40", "50"]}
					></Select>
				</Group>
			</Flex>
		</div>
	)
}
