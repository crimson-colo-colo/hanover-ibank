import type { ContentStatus, ContentType, EmployeeRole, TagCategory } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"

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
	Link: "Link",
	Object: "File",
}

export const tagCategoryDisplayName: Record<TagCategory, string> = {
	IntendedAudience: "Intended Audience",
	DocumentType: "Document Type",
	Custom: "Custom",
}

export const fileTypeDisplayName: Record<FileType, string> = {
	[FileType.WordDocument]: "Word Document",
	[FileType.Pdf]: "PDF",
	[FileType.Excel]: "Excel Spreadsheet",
	[FileType.Powerpoint]: "PowerPoint Presentation",
	[FileType.Plaintext]: "Text",
	[FileType.Image]: "Image",
	[FileType.Unknown]: "Unknown",
	[FileType.Audio]: "Audio",
	[FileType.Video]: "Video",
	[FileType.Link]: "Link",
}

export const ContentViews = {
	Default: "default",
	ExpiringSoon: "expiringSoon",
	RecentlyViewed: "recentlyViewed",
	RecentlyEdited: "recentlyEdited",
	CheckedOut: "checkedOut",
} as const

export type ContentViews = (typeof ContentViews)[keyof typeof ContentViews]
