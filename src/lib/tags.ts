import { type Tag, TagCategory } from "@prisma/browser.ts"

export function stringifyTag(tag: Tag) {
	return `${tag.category}:${tag.name}`
}
export function unstringifyTag(value: string): Tag {
	if (!value.includes(":")) {
		return { category: TagCategory.Custom, name: value } as Tag
	}
	const colon = value.indexOf(":")
	const category = value.substring(0, colon)
	const name = value.substring(colon + 1)
	if (!Object.values(TagCategory).includes(category as TagCategory)) {
		return { category: TagCategory.Custom, name: value } as Tag
	}
	return { category: category as TagCategory, name }
}

export function unstringifyTagList(value: string): Tag[] {
	return value.split("\0").map((tag) => unstringifyTag(tag))
}

export function stringifyTagList(tags: Tag[]): string {
	return tags.map((tag) => stringifyTag(tag)).join("\0")
}
