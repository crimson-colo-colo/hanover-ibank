import type { ContentStatus, ContentType, EmployeeRole, TagCategory } from "@prisma/browser.ts"

export const employeeRoleDisplayName: Record<EmployeeRole, string> = {
	BusinessAnalyst: "Business Analyst",
	Underwriter: "Underwriter",
	Admin: "Admin",
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
