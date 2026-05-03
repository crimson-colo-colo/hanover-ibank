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
} from "@mantine/core"
import { activityLabelToStringTable } from "@shared/activityLabels.ts"
import { IconSearch, IconSortAscending2, IconSortDescending2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
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
import { useMemo, useRef, useState } from "react"
import { Avatar } from "@/components/Avatar.tsx"
import { EmployeeSearch } from "@/components/EmployeeSearch.tsx"
import { checkedOutByFilterFn, fuzzyFilter, fuzzySort, tagFilterFn } from "@/lib/table.ts"
import { trpc } from "@/lib/trpc.ts"

export const Route = createFileRoute("/admin/activity-log")({
	component: RouteComponent,
})

function RouteComponent() {
	//May want to use this in the future if I decide to re-query the activity logs with a new employeeID filter
	//For some reason doing that with the table crashed my browser
	//const [employeeID, setEmployeeID] = useState<string | undefined>(undefined)
	const [searching, setSearching] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const [pagination, setPagination] = useState({
		pageIndex: 0, //initial page index
		pageSize: 10, //default page size
	})

	const allLogs = useQuery(
		trpc.activityLogging.listUserActivity.queryOptions({ employeeId: undefined })
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
					<Group>
						<Text>{info.row.original.displayName}</Text>
						<Avatar
							userId={info.row.original.employeeId}
							alt={info.row.original.displayName}
							width={24}
							height={24}
							radius="100%"
							className="w-6 h-6 shrink-0"
						></Avatar>
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
				header: "Content Title",
				enableSorting: true,
				cell: (info) => <Text>{info.getValue()}</Text>,
			}),
			columnHelper.accessor("timestamp", {
				id: "timestamp",
				header: "Timestamp",
				enableSorting: true,
				cell: (info) => <Text>{info.getValue().toLocaleString()}</Text>,
			}),
		],
		[]
	)

	const table = useReactTable({
		data: allLogs.data ?? [],
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
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
				pageSize: 10, //custom default page size
			},
		},
		state: {
			pagination,
		},
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		getFilteredRowModel: getFilteredRowModel(),
	})

	const rows = table.getRowModel().rows.map((row) => (
		<Table.Tr key={row.id} bg={row.getIsSelected() ? "fuchsia.0" : undefined}>
			{row.getVisibleCells().map((cell) => (
				<Table.Td key={cell.id}>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</Table.Td>
			))}
		</Table.Tr>
	))

	const setFilter = (val: string | undefined) => {
		table.getColumn("employee")?.setFilterValue(val)
		table.setPageIndex(0)
	}

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
		</div>
	)
}
