import { trpc } from "@/lib/trpc.ts"
import "@iamjariwala/react-doc-viewer/dist/index.css"
import { Image, ScrollArea } from "@mantine/core"
import { FileType } from "@shared/filetype.ts"
import { useQuery } from "@tanstack/react-query"
import worker from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { createContext, useContext, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import type { ContentListItem } from "../../server/routers/content.ts"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(worker, import.meta.url).toString()

const options = {
	cMapUrl: "/cmaps/",
}

interface FilePreviewContext {
	controls: React.ReactNode
	preview: React.ReactNode
}

const FilePreviewContext = createContext<FilePreviewContext | null>(null)

export function FilePreviewProvider({
	content,
	fileType,
	closeViewer,
	children,
}: {
	content: ContentListItem
	fileType: FileType
	closeViewer: () => void
	children: React.ReactNode
}) {
	const { data: preview } = useQuery(trpc.preview.getContentUrl.queryOptions({ id: content.id }))
	const { data: plaintextContent } = useQuery(
		trpc.preview.getPlaintextContent.queryOptions(
			{ id: content.id },
			{ enabled: fileType === FileType.Plaintext }
		)
	)

	const [numPages, setNumPages] = useState<number>()

	function onLoadSuccess({ numPages }: { numPages: number }): void {
		setNumPages(numPages)
	}

	let contentDisplay: React.ReactNode

	if (fileType === FileType.Image) {
		contentDisplay = <Image src={preview?.url} alt={content.title} />
	} else if (fileType === FileType.Audio) {
		contentDisplay = (
			// biome-ignore lint/a11y/useMediaCaption: user generated content
			<audio controls src={preview?.url} className="max-w-200"></audio>
		)
	} else if (fileType === FileType.Video) {
		contentDisplay = (
			// biome-ignore lint/a11y/useMediaCaption: user generated content
			<video controls src={preview?.url} className="w-full"></video>
		)
	} else if (
		fileType === FileType.Pdf ||
		fileType === FileType.WordDocument ||
		fileType === FileType.Excel ||
		fileType === FileType.Powerpoint
	) {
		contentDisplay = (
			<ScrollArea className="relative flex flex-col items-center justify-center flex-1 w-full h-full min-h-0">
				<Document
					file={preview?.url}
					options={options}
					onLoadSuccess={onLoadSuccess}
					className="flex flex-col items-center w-full gap-4 bg-transparent"
				>
					{new Array(numPages).fill(0).map((_, index) => (
						<Page
							// biome-ignore lint/suspicious/noArrayIndexKey: foo
							key={index}
							pageNumber={index + 1}
						/>
					))}
				</Document>
			</ScrollArea>
		)
	} else if (fileType === FileType.Plaintext) {
		contentDisplay = plaintextContent?.text ? (
			<ScrollArea className="w-full h-full p-4 bg-white rounded-md">
				<pre className="whitespace-pre-wrap">{plaintextContent.text}</pre>
			</ScrollArea>
		) : (
			<p>Unable to preview this file type.</p>
		)
	}

	return (
		<FilePreviewContext.Provider
			value={{
				controls: null,
				preview: (
					<div className="relative flex flex-col items-center justify-center flex-1 h-full min-w-0 min-h-0 shrink">
						{/** biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
						{/** biome-ignore lint/a11y/useKeyWithClickEvents: backdrop */}
						<div className="absolute inset-0" onClick={closeViewer}></div>
						{contentDisplay}
					</div>
				),
			}}
		>
			{children}
		</FilePreviewContext.Provider>
	)
}

export function FilePreviewControls() {
	const filePreviewContext = useContext(FilePreviewContext)

	if (!filePreviewContext) {
		throw new Error("FilePreviewControls must be used within a FilePreviewProvider")
	}

	return <>{filePreviewContext.controls}</>
}

export function FilePreview() {
	const filePreviewContext = useContext(FilePreviewContext)

	if (!filePreviewContext) {
		throw new Error("FilePreview must be used within a FilePreviewProvider")
	}

	return <>{filePreviewContext.preview}</>
}
