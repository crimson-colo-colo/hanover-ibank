import type { Content } from "@prisma/browser.ts"

export function formatBytes(bytes: number) {
	if (bytes === 0) return "0 Bytes"
	const k = 1024
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

export function getContentTarget(item: Content) {
	if (item.type === "Link") {
		if (!item.url) {
			throw new Error(`Content item with id ${item.id} is of type Link but has no URL`)
		}
		return item.url
	} else {
		return `/content/download/${item.id}`
	}
}
