import { Flex, Group, Pill, Tooltip } from "@mantine/core"
import { type EmployeeRole, TagCategory } from "@prisma/browser.ts"
import type { ContentListItem } from "@shared/types.ts"
import type { CellContext } from "@tanstack/react-table"
import { employeeRoleDisplayName, tagCategoryDisplayName } from "@/lib/enums.ts"

export function TagColumn({ info }: { info: CellContext<ContentListItem, string> }) {
	return (
		<Group gap={4} className="max-w-[25vw]">
			{info.row.original.tags.slice(0, 3).map((tag) => (
				<Tooltip
					withArrow
					arrowSize={8}
					key={`${tag.category}-${tag.name}`}
					label={`${tagCategoryDisplayName[tag.category]}: ${
						tag.category === TagCategory.IntendedAudience
							? employeeRoleDisplayName[tag.name as EmployeeRole]
							: tag.name
					}`}
				>
					<Pill key={`${tag.category}-${tag.name}`} size="xs" color="gray">
						{tag.category === TagCategory.IntendedAudience
							? employeeRoleDisplayName[tag.name as EmployeeRole]
							: tag.name}
					</Pill>
				</Tooltip>
			))}
			{info.row.original.tags.length > 3 && (
				<Tooltip
					withArrow
					arrowSize={8}
					label={
						<Flex direction="column">
							{info.row.original.tags.slice(3).map((tag) => (
								<span key={`${tag.category}-${tag.name}`}>
									{tagCategoryDisplayName[tag.category]}:{" "}
									{tag.category === TagCategory.IntendedAudience
										? employeeRoleDisplayName[tag.name as EmployeeRole]
										: tag.name}
								</span>
							))}
						</Flex>
					}
				>
					<Pill size="xs" color="gray">
						+{info.row.original.tags.length - 3}
					</Pill>
				</Tooltip>
			)}
		</Group>
	)
}
