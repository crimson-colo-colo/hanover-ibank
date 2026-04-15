import { Group, Pill, TagsInput } from "@mantine/core"
import { type Tag, TagCategory } from "@prisma/browser.ts"
import { useQuery } from "@tanstack/react-query"
import { tagCategoryDisplayName } from "@/lib/enums.ts"
import { stringifyTag, unstringifyTag } from "@/lib/tags.ts"
import { trpc } from "@/lib/trpc.ts"

export function ContentTagsInput({
	value,
	onChange,
}: {
	value: Tag[]
	onChange: (tags: Tag[]) => void
}) {
	const availableTags = useQuery(trpc.content.listTagsByCategory.queryOptions())

	return (
		<TagsInput
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
					<Pill withRemoveButton onRemove={onRemove}>
						{category === TagCategory.Custom
							? name
							: `${tagCategoryDisplayName[category as TagCategory]}: ${name}`}
					</Pill>
				)
			}}
		/>
	)
}
