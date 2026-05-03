import {
	ActionIcon,
	Combobox,
	Flex,
	Group,
	Image,
	InputBase,
	Paper,
	Stack,
	Text,
	Timeline,
	Tooltip,
	useCombobox,
} from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { activityLabelToStringTimeline } from "@shared/activityLabels.ts"
import { IconCircleX, IconLoader2, IconSearch } from "@tabler/icons-react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { type RefObject, useEffect, useRef, useState } from "react"
import { Avatar } from "@/components/Avatar.tsx"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

export function TimelineModule() {
	const [employeeID, setEmployeeID] = useState<string | undefined>(undefined)

	const { data: userData } = useQuery(trpc.userActivity.viewRecentActivity.queryOptions())
	const { data: allUserActivity } = useQuery(
		trpc.activityLogging.listUserActivity.queryOptions({ employeeId: employeeID })
	)
	const { data: userInfo } = useQuery(trpc.admin.listUsers.queryOptions())
	const contentIDs = allUserActivity?.map((item) => item.contentId ?? "") ?? []
	const { data: allContentTitles } = useQuery(
		trpc.content.getTitles.queryOptions({ contentIds: contentIDs })
	)
	const [searching, setSearching] = useState(false)

	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (searching) {
			inputRef.current?.focus()
		}
	}, [searching])

	return (
		<Paper withBorder p="md" radius="md" h="100%">
			<Group gap={6} justify="space-between">
				<Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="md">
					Recent User Activity
				</Text>
				{searching ? (
					<ContentOwnerSearch
						onSubmit={setEmployeeID}
						setSearching={setSearching}
						inputRef={inputRef}
					/>
				) : (
					<ActionIcon
						variant="subtle"
						mb="md"
						onClick={() => {
							setSearching(!searching)
						}}
					>
						<IconSearch size={22} />
					</ActionIcon>
				)}
			</Group>
			<div style={{ maxHeight: 200, overflowY: "auto" }}>
				<Timeline active={userData?.length ?? 0} bulletSize={24} lineWidth={2}>
					{allUserActivity?.map((item, i) => {
						const title = activityLabelToStringTimeline[item.action]
						const display_name = userInfo?.find((entry) => entry.id === item.employeeId)?.name
						const content = allContentTitles?.find((entry) => entry.id === item.contentId)
						return (
							<Timeline.Item // biome-ignore lint/suspicious/noArrayIndexKey: foo
								key={i}
								bullet={<Avatar userId={item.employeeId} />}
								title={title}
							>
								<Flex gap={6} align="center" wrap="nowrap">
									<Text size="sm" c="dimmed" style={{ flexShrink: 0 }} className="truncate">
										{display_name}
									</Text>
									{content?.title !== undefined && (
										<>
											<Text c="dimmed" className="text-sm">
												·
											</Text>
											<Tooltip label={content.title} withArrow arrowSize={8} openDelay={300}>
												<Text c="dimmed" className="text-sm truncate">
													{content.title}
												</Text>
											</Tooltip>
										</>
									)}
								</Flex>
								<Text size="xs" mt={4}>
									{new Date(item.timestamp).toLocaleString()}
								</Text>
							</Timeline.Item>
						)
					})}
				</Timeline>
			</div>
		</Paper>
	)
}

function ContentOwnerSearch({
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
