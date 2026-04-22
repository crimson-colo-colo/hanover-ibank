import { Group, Pill, TagsInput } from "@mantine/core"
import { type EmployeeRole, type Tag, TagCategory } from "@prisma/browser.ts"
import { useQuery } from "@tanstack/react-query"
import { employeeRoleDisplayName, tagCategoryDisplayName } from "@/lib/enums.ts"
import { stringifyTag, unstringifyTag } from "@/lib/tags.ts"
import { trpc } from "@/lib/trpc.ts"

export function ContentTagsInput({
	enabled = true,
	value,
	onChange,
}: {
	enabled?: boolean
	value: Tag[]
	onChange: (tags: Tag[]) => void
}) {
	const availableTags = useQuery(trpc.content.listTagsByCategory.queryOptions())

	return (
		<TagsInput
			className="content-tags-input"
			disabled={!enabled}
			value={value.map((tag) => stringifyTag(tag))}
			onChange={(values) => {
				const tags = values.map((value) => unstringifyTag(value))
				onChange(tags)
			}}
			data={Object.entries(availableTags.data ?? {}).map(([category, tags]) => ({
				group: tagCategoryDisplayName[category as TagCategory],
				items: tags.map((tag) => `${tag.category}:${tag.name}`),
			}))}
			renderOption={({ option }) => {
				const { name } = unstringifyTag(option.value)
				return <Group>{name}</Group>
			}}
			renderPill={({ option, onRemove }) => {
				const { category, name } = unstringifyTag(option.value as string)
				return (
					<Pill withRemoveButton onRemove={onRemove} disabled={!enabled}>
						{category === TagCategory.Custom
							? name
							: `${tagCategoryDisplayName[category as TagCategory]}: ${category === TagCategory.IntendedAudience ? employeeRoleDisplayName[name as EmployeeRole] : name}`}
					</Pill>
				)
			}}
		/>
	)
}
