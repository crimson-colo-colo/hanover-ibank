import type { ContentListItem } from "@shared/types.ts"
import { compareItems, type RankingInfo, rankItem } from "@tanstack/match-sorter-utils"
import { type FilterFn, type SortingFn, sortingFns } from "@tanstack/react-table"
import type { FilterOptions } from "../components/TagFilterPopup.tsx"

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

export const tagFilterFn: FilterFn<ContentListItem> = (
	row,
	columnId,
	filterValue: FilterOptions
) => {
	const rowTagNames = row.original.tags.map((t) => t.name)
	const optionTags = filterValue.tags
	const filterMode = filterValue.mode

	if (filterMode === "Exactly these tags") {
		return (
			rowTagNames.length === optionTags.length &&
			optionTags.every((selected) => rowTagNames.includes(selected))
		)
	}

	if (filterMode === "Not these tags") {
		if (optionTags.length === 0) return true
		return !optionTags.some((selected) => rowTagNames.includes(selected))
	}

	if (filterMode === "Includes these tags") {
		return optionTags.every((selected) => rowTagNames.includes(selected))
	}

	return false
}
