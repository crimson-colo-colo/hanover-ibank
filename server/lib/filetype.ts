import { FileType } from "@shared/filetype.ts"
import { fileTypeFromBuffer } from "file-type"

export async function getFileTypeFromFile(filename: string, buffer: Buffer): Promise<FileType> {
	const type = await fileTypeFromBuffer(buffer)
	if (type) {
		if (type.mime.startsWith("audio/")) {
			return FileType.Audio
		}

		if (type.mime.startsWith("video/")) {
			return FileType.Video
		}

		if (type.mime.startsWith("image/")) {
			return FileType.Image
		}

		switch (type.mime) {
			case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				return FileType.WordDocument
			case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
				return FileType.Powerpoint
			case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
				return FileType.Excel
			case "application/pdf":
				return FileType.Pdf
			case "text/plain":
				return FileType.Plaintext
		}
	}

	// check file extension as a fallback
	const extension = filename.split(".").pop()?.toLowerCase()
	switch (extension) {
		case "doc":
		case "docx":
		case "docm":
			return FileType.WordDocument
		case "ppt":
		case "pptx":
		case "pptm":
			return FileType.Powerpoint
		case "xls":
		case "xlsx":
		case "xlsm":
			return FileType.Excel
		case "pdf":
			return FileType.Pdf
		case "txt":
		case "md":
		case "csv":
		case "rtf":
			return FileType.Plaintext
		case "jpg":
		case "jpeg":
		case "png":
		case "gif":
		case "webp":
		case "svg":
		case "bmp":
		case "tiff":
			return FileType.Image
		case "mp4":
		case "mov":
		case "avi":
		case "mkv":
		case "webm":
		case "flv":
			return FileType.Video
		case "mp3":
		case "wav":
		case "ogg":
		case "flac":
		case "aac":
		case "m4a":
			return FileType.Audio
	}
	return FileType.Unknown
}

export function getFileExtensionForType(fileType: string): string {
	switch (fileType) {
		case FileType.WordDocument:
			return ".docx"
		case FileType.Excel:
			return ".xlsx"
		case FileType.Powerpoint:
			return ".pptx"
		case FileType.Pdf:
			return ".pdf"
		case FileType.Plaintext:
			return ".txt"
		case FileType.Audio:
			return ".mp3"
		case FileType.Video:
			return ".mp4"
		case FileType.Image:
			return ".png"
		case FileType.Link:
			return ".html"
		default:
			return ".bin"
	}
}
