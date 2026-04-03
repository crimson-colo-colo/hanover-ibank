import type { ContentStatus, DocumentType, EmployeeRole } from "@prisma/browser.ts"

export const employeeRoleDisplayName: Record<EmployeeRole, string> = {
	BusinessAnalyst: "Business Analyst",
	Underwriter: "Underwriter",
}

export const documentTypeDisplayName: Record<DocumentType, string> = {
	Workflow: "Workflow Content",
	Reference: "Reference Content",
}

export const contentStatusDisplayName: Record<ContentStatus, string> = {
	Complete: "Complete",
	Incomplete: "Incomplete",
	UnderReview: "Under Review",
}
