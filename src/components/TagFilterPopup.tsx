import { ActionIcon, Group, Indicator, Popover, Text } from "@mantine/core"
import type { Column } from "@tanstack/react-table"
import { useState } from "react"
import type { ContentListItem } from "../../server/routers/content.ts"

type Tag = ContentListItem["tags"][number]

interface TagFilterPopupProps {
	column: Column<ContentListItem, string>
	allTags: Tag[]
}

export function TagFilterPopup({ column, allTags }) {
	const [open, setOpen] = useState(false)
	const [selected, setSelected] = useState<string[]>([])

	const toggleTag = (tagName: string) => {
		const next = selected.includes(tagName)
			? selected.filter((t) => t !== tagName)
			: [...selected, tagName]
		setSelected(next)
		column.setFilterValue(next.length ? next : undefined)
	}

	const clearAll = () => {
		setSelected([])
		column.setFilterValue(undefined)
	}

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
					<Text fw={500} size="sm">
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
							<IconFilter size={14} />
						</ActionIcon>
					</Indicator>
				</Group>
			</Popover.Target>
		</Popover>
	)
}
