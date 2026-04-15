import { Combobox, Flex, Image, InputBase, Paper, Stack, Text, useCombobox } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import { useDebouncedValue } from "@mantine/hooks"
import { IconLoader2 } from "@tabler/icons-react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

export function ContentOwnerSelect({
	form,
	initialSearchValue,
}: {
	form: UseFormReturnType<{ ownerId: string }>
	initialSearchValue?: string
}) {
	const [searchValue, setSearchValue] = useState(initialSearchValue || "")
	const [debouncedSearchValue] = useDebouncedValue(searchValue, 300)
	const searchResults = useQuery(
		trpc.forms.searchUsers.queryOptions(
			{ query: debouncedSearchValue, roles: [] },
			{
				enabled: !!debouncedSearchValue,
				placeholderData: keepPreviousData,
			}
		)
	)
	const selectedUser = searchResults.data?.find((user) => user.id === form.getValues().ownerId)

	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
	})

	const options = (searchResults.data ?? []).map((user) => (
		<Combobox.Option value={user.id} key={user.id}>
			<Flex gap="md">
				<Image src={`/avatar/${user.id}`} radius="100%" h={40} w={40} />
				<Stack gap={0}>
					<Text size="sm" fw={500}>
						{user.name}
					</Text>
					<Text size="xs" c="gray">
						{user.email} · {employeeRoleDisplayName[user.role]}
					</Text>
				</Stack>
			</Flex>
		</Combobox.Option>
	))

	return (
		<>
			<Combobox
				store={combobox}
				withinPortal={false}
				onOptionSubmit={(val) => {
					form.setFieldValue("ownerId", val)
					setSearchValue(searchResults.data?.find((user) => user.id === val)?.email || val)
					combobox.closeDropdown()
				}}
			>
				<Combobox.Target>
					<InputBase
						rightSection={
							searchResults.isFetching ? <IconLoader2 size={18} /> : <Combobox.Chevron />
						}
						onChange={(event) => {
							setSearchValue(event.currentTarget.value)
						}}
						onClick={() => combobox.openDropdown()}
						onFocus={() => combobox.openDropdown()}
						onBlur={() => {
							combobox.closeDropdown()
							setSearchValue(
								searchResults.data?.find((user) => user.id === form.getValues().ownerId)?.email ||
									""
							)
						}}
						rightSectionPointerEvents="none"
						value={searchValue}
						placeholder="Search users..."
					/>
				</Combobox.Target>

				<Combobox.Dropdown>
					<Combobox.Options>
						{searchResults.isFetching ? (
							<Combobox.Empty>Loading....</Combobox.Empty>
						) : !options.length ? (
							<Combobox.Empty>No results found</Combobox.Empty>
						) : (
							options
						)}
					</Combobox.Options>
				</Combobox.Dropdown>
			</Combobox>
			{selectedUser && (
				<Paper p="sm" bd="1px solid gray.3" mt="xs">
					<Flex gap="md">
						<Image src={`/avatar/${selectedUser.id}`} radius="100%" h={40} w={40} />
						<Stack gap={0} justify="center">
							<Text size="sm" fw={500}>
								{selectedUser.name}
							</Text>
							<Text size="xs" c="gray">
								{selectedUser.email} · {employeeRoleDisplayName[selectedUser.role]}
							</Text>
						</Stack>
					</Flex>
				</Paper>
			)}
		</>
	)
}
