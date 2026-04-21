import {
	ActionIcon,
	Button,
	Checkbox,
	Group,
	Indicator,
	Popover,
	ScrollArea,
	Select,
	Stack,
	Text,
} from "@mantine/core"
import { type EmployeeRole, TagCategory } from "@prisma/browser.ts"
import { IconFilter } from "@tabler/icons-react"
import type { Column } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { employeeRoleDisplayName, tagCategoryDisplayName } from "@/lib/enums.ts"
import type { ContentListItem } from "../../server/routers/content.ts"

type Tag = ContentListItem["tags"][number]

interface TagFilterPopupProps {
	column: Column<ContentListItem, string>
	allTags: Tag[]
}

export type FilterOptions = {
	mode: string
	tags: string[]
}

export function TagFilterPopup({ column, allTags }: TagFilterPopupProps) {
	const [open, setOpen] = useState(false)
	const [selected, setSelected] = useState<string[]>([])
	const [filterMode, setFilterMode] = useState<string>("Includes these tags")
	const filter = column.getFilterValue() as FilterOptions | undefined
	const filterValue = filter !== undefined ? filter.tags : []

	const toggleTag = (tagName: string) => {
		const next = selected.includes(tagName)
			? selected.filter((t) => t !== tagName)
			: [...selected, tagName]
		setSelected(next)
		column.setFilterValue({ mode: filterMode, tags: next })
	}

	const selectMode = (mode: string) => {
		setFilterMode(mode)
		column.setFilterValue({ mode: mode, tags: selected })
	}

	const clearAll = () => {
		setSelected([])
		column.setFilterValue(undefined)
	}

	const tagsByCategory = useMemo(() => {
		return allTags.reduce<Record<string, Tag[]>>((acc, tag) => {
			const cat = tag.category
			if (!acc[cat]) acc[cat] = []
			acc[cat].push(tag)
			return acc
		}, {})
	}, [allTags])

	const hasActiveFilters = selected.length > 0

	return (
		<Popover
			opened={open}
			onChange={setOpen}
			position="bottom-start"
			shadow="md"
			width={260}
			withinPortal
		>
			<Popover.Target>
				<Group
					gap={4}
					style={{ cursor: "pointer", userSelect: "none" }}
					onClick={(e) => {
						e.stopPropagation()
						setOpen((o) => !o)
					}}
				>
					<Text fw={700} size="sm">
						Tags
					</Text>
					<Indicator
						disabled={!hasActiveFilters}
						label={filterValue.length}
						size={16}
						color="fuchsia"
					>
						<ActionIcon
							variant={hasActiveFilters ? "light" : "subtle"}
							color={hasActiveFilters ? "fuchsia" : "gray"}
							size="sm"
						>
							<IconFilter size={15} />
						</ActionIcon>
					</Indicator>
				</Group>
			</Popover.Target>

			<Popover.Dropdown onClick={(e) => e.stopPropagation()}>
				<ScrollArea.Autosize mah={300} offsetScrollbars scrollbarSize={8}>
					<Stack gap="xs">
						<Select
							placeholder="Options"
							data={["Includes these tags", "Exactly these tags", "Not these tags"]}
							defaultValue="Includes these tags"
							comboboxProps={{ withinPortal: false }}
							value={filterMode}
							onChange={(val) => {
								selectMode(val ?? "Includes these tags")
							}}
						/>
						{Object.entries(tagsByCategory).map(([category, tags]) => (
							<div key={category}>
								<Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
									{tagCategoryDisplayName[category as TagCategory]}
								</Text>
								<Stack gap={4}>
									{tags.map((tag) => {
										const displayName =
											tag.category === TagCategory.IntendedAudience
												? employeeRoleDisplayName[tag.name as EmployeeRole]
												: tag.name
										return (
											<Checkbox
												key={`${tag.category}-${tag.name}`}
												label={displayName}
												checked={filterValue.includes(tag.name)}
												onChange={() => toggleTag(tag.name)}
												size="sm"
											/>
										)
									})}
								</Stack>
							</div>
						))}

						{hasActiveFilters && (
							<Button variant="subtle" color="gray" size="xs" onClick={clearAll} mt={4}>
								Clear filters
							</Button>
						)}
					</Stack>
				</ScrollArea.Autosize>
			</Popover.Dropdown>
		</Popover>
	)
}
