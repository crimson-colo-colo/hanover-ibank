export type FileType = (typeof FileType)[keyof typeof FileType]
export const FileType = {
	WordDocument: "docx",
	Powerpoint: "pptx",
	Excel: "xlsx",
	Pdf: "pdf",
	Audio: "audio",
	Video: "video",
	Image: "image",
	Link: "link",
	Plaintext: "plaintext",
	Unknown: "unknown",
} as const
