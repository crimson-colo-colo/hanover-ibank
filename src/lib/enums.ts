import type { ContentStatus, ContentType, EmployeeRole, TagCategory } from "@prisma/browser.ts"

export const employeeRoleDisplayName: Record<EmployeeRole, string> = {
	BusinessAnalyst: "Business Analyst",
	Underwriter: "Underwriter",
	Admin: "Admin",
	ActuarialAnalyst: "Actuarial Analyst",
	ExlOperations: "EXL Operations",
	BusinessOperations: "Business Operations",
}

export const contentStatusDisplayName: Record<ContentStatus, string> = {
	Complete: "Complete",
	Incomplete: "Incomplete",
	UnderReview: "Under Review",
}

export const contentTypeDisplayName: Record<ContentType, string> = {
	Link: "URL",
	Object: "File",
}

export const tagCategoryDisplayName: Record<TagCategory, string> = {
	IntendedAudience: "Intended Audience",
	DocumentType: "Document Type",
	Custom: "Custom",
}

export const ContentViews = {
	Default: "default",
	ExpiringSoon: "expiringSoon",
	RecentlyViewed: "recentlyViewed",
	RecentlyEdited: "recentlyEdited",
	CheckedOut: "checkedOut",
	OwnedContent: "owned",
} as const

export type ContentViews = (typeof ContentViews)[keyof typeof ContentViews]
