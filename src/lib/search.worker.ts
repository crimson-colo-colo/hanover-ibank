import { create, insertMultiple, search } from "@orama/orama"
import { pluginQPS } from "@orama/plugin-qps"
import { ContentStatus, ContentType, EmployeeRole, TagCategory } from "@prisma/browser.ts"
import { ContentFilter } from "@shared/enum.ts"
import { FileType } from "@shared/filetype.ts"
import type { ContentListItem } from "@shared/types.ts"
import { createTRPCClient, httpBatchLink, loggerLink, type TRPCClient } from "@trpc/client"
import * as Comlink from "comlink"
import superjson from "superjson"
import { isDevelopment } from "@/env.ts"
import {
	contentTypeDisplayName,
	employeeRoleDisplayName,
	fileTypeDisplayName,
} from "@/lib/enums.ts"
import type { AppRouter } from "../../server/router.ts"
import { stringifyTag } from "./tags.ts"

export type SearchFilter =
	| {
			id: string
			type: "tag"
			category: TagCategory
			name: string
	  }
	| {
			id: string
			type: "status"
			value: ContentStatus
	  }
	| {
			id: string
			type: "favorited"
	  }
	| {
			id: string
			type: "filetype"
			value: FileType
	  }
	| {
			id: string
			type: "contenttype"
			value: ContentType
	  }

export type SearchFilterItem = {
	id: string
	title: string
	toSearchFilter(): SearchFilter
}

const searchFilters: SearchFilterItem[] = [
	{
		id: "favorited",
		title: "Favorited",
		toSearchFilter(): SearchFilter {
			return { id: this.id, type: "favorited" }
		},
	},
	...Object.values(ContentStatus).map((status) => ({
		id: `status:${status}`,
		title: status,
		toSearchFilter(): SearchFilter {
			return { id: this.id, type: "status", value: status }
		},
	})),
	...["Workflow", "Reference"].map((type) => ({
		id: `tag:${stringifyTag({ category: TagCategory.DocumentType, name: type })}`,
		title: `Document Type: ${type}`,
		toSearchFilter(): SearchFilter {
			return {
				id: this.id,
				type: "tag",
				category: TagCategory.DocumentType,
				name: type,
			}
		},
	})),
	...Object.values(EmployeeRole).map((role) => ({
		id: `tag:${stringifyTag({ category: TagCategory.IntendedAudience, name: role })}`,
		title: `Intended Audience: ${employeeRoleDisplayName[role]}`,
		toSearchFilter(): SearchFilter {
			return {
				id: this.id,
				type: "tag",
				category: TagCategory.IntendedAudience,
				name: role,
			}
		},
	})),
	...Object.values(ContentType).map((type) => ({
		id: `contenttype:${type}`,
		title: `Content Type: ${contentTypeDisplayName[type]}s`,
		toSearchFilter(): SearchFilter {
			return {
				id: this.id,
				type: "contenttype",
				value: type,
			}
		},
	})),
	...Object.values(FileType).map((fileType) => ({
		id: `filetype:${fileType}`,
		title: `File Type: ${fileTypeDisplayName[fileType]}`,
		toSearchFilter(): SearchFilter {
			return {
				id: this.id,
				type: "filetype",
				value: fileType,
			}
		},
	})),
]

function createSearchIndex(items: ContentListItem[], activeFilters: SearchFilter[]) {
	const index = create({
		schema: {
			title: "string",
			owner: {
				name: "string",
				email: "string",
			},
			url: "string",
		},
		plugins: [pluginQPS()],
	})

	insertMultiple(
		index,
		searchFilters.filter((f) => !activeFilters.some((af) => af.id === f.id))
	)

	insertMultiple(
		index,
		items.map((item) => ({
			...item,
			title: item.title.replaceAll(/[_.]+/g, " "),
			url: item.type === "Link" ? item.url : undefined,
			tags: item.tags.map((tag) => tag.name),
		}))
	)

	return index
}

export class SearchWorker {
	readonly trpc: TRPCClient<AppRouter>
	ready: Promise<void>
	items = new Map<string, ContentListItem>()
	index = createSearchIndex([], [])
	filters: SearchFilter[] = []

	constructor(getAccessToken: () => Promise<string>) {
		this.trpc = createTRPCClient<AppRouter>({
			links: [
				loggerLink({
					enabled: (opts) =>
						isDevelopment || (opts.direction === "down" && opts.result instanceof Error),
				}),
				httpBatchLink({
					url: "/trpc",
					transformer: superjson,
					headers: async () => {
						const token = await getAccessToken()
						if (!token) {
							return {}
						}
						return {
							Authorization: `Bearer ${token}`,
						}
					},
				}),
			],
		})
		this.ready = this.#downloadIndex()
	}

	async #downloadIndex(): Promise<void> {
		const items = await this.trpc.content.list.query({ filter: ContentFilter.All })
		console.log("Downloaded content list", items)
		this.items.clear()
		for (const item of items.content) {
			this.items.set(item.id, item)
		}
		this.rebuildIndex()
	}

	async updateIndex() {
		this.ready = this.#downloadIndex()
		await this.ready
	}

	setFilters(filters: SearchFilter[]) {
		this.filters = filters
		this.rebuildIndex()
	}

	rebuildIndex() {
		const subset = Array.from(this.items.values()).filter((item) => {
			return this.filters.every((filter) => {
				switch (filter.type) {
					case "favorited":
						return item.favorited
					case "status":
						return item.status === filter.value
					case "tag":
						return item.tags.some(
							(tag) => tag.category === filter.category && tag.name === filter.name
						)
					case "filetype":
						if (filter.value === FileType.Link) {
							return item.type === ContentType.Link
						}
						return (
							item.type === ContentType.Object && item.object.Metadata?.filetype === filter.value
						)
					case "contenttype":
						return item.type === filter.value
					default:
						throw new Error(`Unknown filter type: ${(filter as SearchFilter).type}`)
				}
			})
		})

		const start = performance.now()
		this.index = createSearchIndex(subset, this.filters)
		const end = performance.now()
		console.log(`Rebuilt search index with ${subset.length} items in ${end - start}ms`)
	}

	async search(query: string): Promise<(ContentListItem | SearchFilter)[]> {
		await this.ready

		const results = await search(this.index, {
			mode: "fulltext",
			limit: 20,
			term: query,
			tolerance: 1,
		})

		return results.hits
			.sort((a, b) => b.score - a.score)
			.map((hit) => {
				const filter = searchFilters.find((filter) => filter.id === hit.id)
				if (filter) {
					return filter.toSearchFilter()
				}

				return this.items.get(hit.id)!
			})
			.filter((item): item is NonNullable<typeof item> => item !== undefined)
	}
}

Comlink.expose(SearchWorker)
