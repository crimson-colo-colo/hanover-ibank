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
export const fileTypeToMime: Record<FileType, string> = {
	pdf: "application/pdf",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	plaintext: "text/plain",
	image: "image/png",
	audio: "audio/mpeg",
	video: "video/mp4",
	link: "text/html",
	unknown: "application/octet-stream",
}
