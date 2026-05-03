import {
	ActionIcon,
	Combobox,
	Flex,
	Image,
	InputBase,
	Stack,
	Text,
	useCombobox,
} from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { IconCircleX, IconLoader2 } from "@tabler/icons-react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { type RefObject, useState } from "react"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

export function EmployeeSearch({
	onSubmit,
	setSearching,
	inputRef,
}: {
	onSubmit: (val: string | undefined) => void
	setSearching: (val: boolean) => void
	inputRef: RefObject<HTMLInputElement | null>
}) {
	const [searchValue, setSearchValue] = useState("")
	const [selected, setSelected] = useState(false)
	const [selectedVal, setSelectedVal] = useState<string | undefined>(undefined)
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
		<Combobox
			store={combobox}
			withinPortal={false}
			onOptionSubmit={(val) => {
				const user = searchResults.data?.find((user) => user.id === val)
				setSearchValue(user?.name ?? "")
				setSelected(true)
				setSelectedVal(user?.name ?? "")
				onSubmit(val)
				combobox.closeDropdown()
			}}
		>
			<Combobox.Target>
				<InputBase
					ref={inputRef}
					rightSection={
						searchResults.isFetching ? (
							<IconLoader2 size={18} />
						) : (
							<ActionIcon
								variant="transparent"
								onClick={(e) => {
									e.stopPropagation()
									setSelected(false)
									setSelectedVal(undefined)
									onSubmit(undefined)
									setSearchValue("")
									setSearching(false)
								}}
							>
								{" "}
								<IconCircleX />{" "}
							</ActionIcon>
						)
					}
					onChange={(event) => {
						setSearchValue(event.currentTarget.value)
					}}
					onClick={() => combobox.openDropdown()}
					onFocus={() => combobox.openDropdown()}
					onBlur={() => {
						if (!selected) {
							setSearchValue("")
							setSearching(false)
							onSubmit(undefined)
						}
						if (selected && searchValue !== selectedVal && selectedVal !== undefined) {
							setSearchValue(selectedVal)
						}

						combobox.closeDropdown()
					}}
					rightSectionPointerEvents="all"
					value={searchValue}
					placeholder="Search users..."
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							const firstResult = searchResults.data?.[0]
							if (firstResult) {
								setSearchValue(firstResult.name)
								setSelected(true)
								setSelectedVal(firstResult.name)
								combobox.closeDropdown()
								onSubmit(firstResult.id)
							}
						}
					}}
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
	)
}
