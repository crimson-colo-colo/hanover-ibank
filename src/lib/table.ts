import { compareItems, type RankingInfo, rankItem } from "@tanstack/match-sorter-utils"
import { type FilterFn, type SortingFn, sortingFns } from "@tanstack/react-table"
import type { TagFilterPopup } from "@/components/TagFilterPopup.tsx"
import type { ContentListItem } from "../../server/routers/content.ts"

declare module "@tanstack/react-table" {
	interface FilterFns {
		fuzzy: FilterFn<unknown>
		tagFilterFn: FilterFn<unknown>
	}
	interface SortingFns {
		fuzzy: SortingFn<unknown>
	}
	interface FilterMeta {
		itemRank: RankingInfo
	}
}

export const fuzzyFilter: FilterFn<ContentListItem> = (row, columnId, value, addMeta) => {
	const itemRank = rankItem(row.getValue(columnId), value)
	addMeta({ itemRank })
	return itemRank.passed
}

export const fuzzySort: SortingFn<ContentListItem> = (rowA, rowB, columnId) => {
	let dir = 0

	if (rowA.columnFiltersMeta[columnId]) {
		dir = compareItems(
			rowA.columnFiltersMeta[columnId].itemRank!,
			rowB.columnFiltersMeta[columnId].itemRank!
		)
	}

	return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}

export type TagFilterMode = "Exactly these tags" | "Not these tags" | "Includes these tags"

export type TagFilterValue = {
	optionTags: string[]
	mode: TagFilterPopup.filterMode
}

export const tagFilterFn: FilterFn<ContentListItem> = (row, columnId, filterValue: string[]) => {
	//typeof TagFilterValue  {tags, option}
	//const {tags, mode} = filterValue as unknown as { tags: string[], mode: string }

	//const mode = filterValue as unknown as string

	const rowTagNames = row.original.tags.map((t) => t.name)

	const { optionTags, mode } = filterValue as unknown as TagFilterValue

	//const mode = "Not these tags"

	console.log("Mode: " + mode)
	console.log("Option Tags: " + optionTags)
	console.log("filterValue: " + filterValue)

	if (mode === "Exactly these tags") {
		return (
			rowTagNames.length === optionTags.length &&
			optionTags.every((selected) => rowTagNames.includes(selected))
		)
	}

	if (mode === "Not these tags") {
		return !optionTags.every((selected) => rowTagNames.includes(selected))
	}

	if (mode === "Includes these tags") {
		return optionTags.every((selected) => rowTagNames.includes(selected))
	}

	return true
}
