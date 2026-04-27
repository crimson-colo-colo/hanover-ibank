import {
	ActionIcon,
	Button,
	Checkbox,
	Flex,
	Group,
	Modal,
	NumberInput,
	Pagination,
	Select,
	Table,
	Text,
	Title,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import {
	IconLoader2,
	IconPencil,
	IconPlus,
	IconSortAscending2,
	IconSortDescending2,
	IconTrash,
} from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import clsx from "clsx"
import { useMemo, useState } from "react"
import { Avatar } from "@/components/Avatar.tsx"
import { CreateUserForm } from "@/components/CreateUserForm.tsx"
import { UpdateUserForm, type UpdateUserValues } from "@/components/UpdateUserForm.tsx"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { fuzzyFilter, fuzzySort, tagFilterFn } from "@/lib/table.ts"
import { trpc } from "@/lib/trpc.ts"
import { HelpHint } from "@/components/help.hint.tsx"

export const Route = createFileRoute("/admin/manage-users")({
	component: RouteComponent,
})

function RouteComponent() {
	const users = useQuery(trpc.admin.listUsers.queryOptions())

	const [updateOpened, { open: openUpdateDialog, close: closeUpdateDialog }] = useDisclosure(false)
	const [deleteOpened, { open: openDeleteDialog, close: closeDeleteDialog }] = useDisclosure(false)
	const [createOpened, { open: openCreateDialog, close: closeCreateDialog }] = useDisclosure(false)
	const [selectedUserForUpdate, setSelectedUserForUpdate] = useState<UpdateUserValues | null>(null)

	const deleteUser = useMutation(trpc.admin.deleteUsers.mutationOptions())

	const [rowSelection, setRowSelection] = useState({})
	const [pagination, setPagination] = useState({
		pageIndex: 0, //initial page index
		pageSize: 10, //default page size
	})

	const columnHelper = createColumnHelper<NonNullable<(typeof users)["data"]>[number]>()

	const columns = useMemo(
		() => [
			columnHelper.display({
				id: "checkbox",
				cell: (props) => (
					<Checkbox
						aria-label="Select row"
						checked={props.row.getIsSelected()}
						onChange={() => props.row.toggleSelected()}
					/>
				),
			}),
			columnHelper.accessor("name", {
				header: "Name",
				enableSorting: true,
				sortingFn: "alphanumeric",
				cell: (props) => (
					<Flex gap="xs">
						<Avatar userId={props.row.original.id} alt={props.row.original.name} h={24} w={24} />
						<span>{props.getValue()}</span>
					</Flex>
				),
			}),
			columnHelper.accessor("username", {
				header: "Username",
				enableSorting: true,
				sortingFn: "alphanumeric",
			}),
			columnHelper.accessor("email", {
				header: "Email",
				enableSorting: true,
				sortingFn: "alphanumeric",
			}),
			columnHelper.accessor("role", {
				header: "Role",
				cell: (props) => employeeRoleDisplayName[props.row.original.role],
				enableSorting: true,
				sortingFn: "alphanumeric",
			}),
			columnHelper.display({
				id: "actions",
				cell: (props) => (
					<ActionIcon
						variant="subtle"
						onClick={() => {
							setSelectedUserForUpdate({
								id: props.row.original.id,
								name: props.row.original.name,
								email: props.row.original.email,
								username: props.row.original.username,
								role: props.row.original.role,
							})
							openUpdateDialog()
						}}
					>
						<IconPencil />
					</ActionIcon>
				),
			}),
		],
		[]
	)

	const table = useReactTable({
		data: users.data ?? [],
		initialState: {
			sorting: [{ id: "name", desc: false }],
			pagination: {
				pageIndex: 0, //custom initial page index
				pageSize: 10, //custom default page size
			},
		},
		filterFns: {
			fuzzy: fuzzyFilter,
			tagFilterFn: tagFilterFn,
		},
		sortingFns: {
			fuzzy: fuzzySort,
		},
		enableSortingRemoval: false,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			rowSelection,
			pagination,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
	})

	if (users.isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<IconLoader2 className="animate-spin" />
			</div>
		)
	}

	const rows = table.getRowModel().rows.map((row) => (
		<Table.Tr key={row.id} bg={row.getIsSelected() ? "fuchsia.0" : undefined}>
			{row.getVisibleCells().map((cell) => (
				<Table.Td key={cell.id}>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</Table.Td>
			))}
		</Table.Tr>
	))

	return (
		<div>
			<Group
				id="manage-users-header"
				justify="space-between"
				mb="md"
				className="flex-col sm:flex-row"
			>
				<Group gap="xs" align="center" wrap="nowrap">
					<Title order={2}>Manage Users</Title>
					<HelpHint
						feature="employee management"
						steps={[
							{
								target: "#manage-users-header",
								title: "Manage Employees",
								content:
									"View, edit, and delete employee accounts from this table. Each row shows the employee's name, username, email, and role.",
								placement: "bottom",
							},
						]}
					/>
				</Group>
				<Group gap="xs">
					<Button
						leftSection={<IconTrash />}
						variant="subtle"
						disabled={table.getSelectedRowModel().rows.length === 0}
						color="red"
						onClick={() => {
							openDeleteDialog()
						}}
					>
						Delete selected
					</Button>
					<Button
						id="add-user-btn"
						leftSection={<IconPlus />}
						onClick={() => {
							openCreateDialog()
						}}
					>
						Add user
					</Button>
					<HelpHint
						feature="adding a new employee"
						steps={[
							{
								target: "#add-user-btn",
								title: "Add a New Employee",
								content:
									"Click here to create a new employee account. You'll set their name, email, username, and role (e.g. Underwriter, Analyst, Admin).",
								placement: "bottom",
							},
						]}
					/>
				</Group>
			</Group>
			<Modal opened={deleteOpened} onClose={closeDeleteDialog} title="Confirm Deletion">
				<Text>
					Are you sure you want to delete the selected users?{" "}
					<strong>This action cannot be undone.</strong>
				</Text>
				<Group mt="md" gap="sm" justify="end">
					<Button variant="subtle" color="gray" onClick={closeDeleteDialog}>
						Cancel
					</Button>
					<Button
						color="red"
						disabled={deleteUser.isPending}
						onClick={() => {
							const idsToDelete = table.getSelectedRowModel().rows.map((r) => r.original.id)
							deleteUser.mutate(idsToDelete, {
								onSuccess: () => {
									table.resetRowSelection()
									users.refetch()
									closeDeleteDialog()
									notifications.show({
										title: "Users deleted",
										message: "The selected users have been deleted successfully.",
										color: "emerald",
									})
								},
							})
						}}
					>
						{deleteUser.isPending ? <IconLoader2 className="animate-spin" /> : "Delete"}
					</Button>
				</Group>
			</Modal>
			<Modal opened={createOpened} onClose={closeCreateDialog} title="Add User">
				<CreateUserForm
					onSuccess={() => {
						users.refetch()
						closeCreateDialog()
					}}
					close={closeCreateDialog}
				/>
			</Modal>
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
			<Modal opened={updateOpened} onClose={closeUpdateDialog} title="Edit User">
				{selectedUserForUpdate && (
					<UpdateUserForm
						user={selectedUserForUpdate}
						onSuccess={() => {
							users.refetch()
							closeUpdateDialog()
						}}
					/>
				)}
			</Modal>
		</div>
	)
}
