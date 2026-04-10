import { compareItems, type RankingInfo, rankItem } from "@tanstack/match-sorter-utils"
import { type FilterFn, type SortingFn, sortingFns } from "@tanstack/react-table"
import type { ContentListItem } from "../../server/routers/content.ts"

declare module "@tanstack/react-table" {
	interface FilterFns {
		fuzzy: FilterFn<unknown>
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
