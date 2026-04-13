export type ContentFilter = (typeof ContentFilter)[keyof typeof ContentFilter]
export const ContentFilter = {
	Own: "Own",
	All: "All",
} as const
