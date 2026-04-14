import { trpc } from "@/lib/trpc.ts"
import "@iamjariwala/react-doc-viewer/dist/index.css"
import { Image, ScrollArea } from "@mantine/core"
import { FileType } from "@shared/filetype.ts"
import { useQuery } from "@tanstack/react-query"
import worker from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import type { ContentListItem } from "../../server/routers/content.ts"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(worker, import.meta.url).toString()

const options = {
	cMapUrl: "/cmaps/",
}

export function FileViewer({
	content,
	fileType,
	closeViewer,
}: {
	content: ContentListItem
	fileType: FileType
	closeViewer: () => void
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
			<ScrollArea className="h-full flex flex-col justify-center flex-1 min-h-0 items-center relative">
				<Document
					file={preview?.url}
					options={options}
					onLoadSuccess={onLoadSuccess}
					className="w-full bg-transparent flex flex-col gap-4 items-center"
				>
					{new Array(numPages).fill(0).map((_, index) => (
						<Page
							// biome-ignore lint/suspicious/noArrayIndexKey: foo
							key={index}
							pageNumber={index + 1}
							canvasBackground="transparent"
						/>
					))}
				</Document>
			</ScrollArea>
		)
	} else if (fileType === FileType.Plaintext) {
		contentDisplay = plaintextContent?.text ? (
			<ScrollArea className="h-full w-full bg-white p-4 rounded-md">
				<pre className="whitespace-pre-wrap">{plaintextContent.text}</pre>
			</ScrollArea>
		) : (
			<p>Unable to preview this file type.</p>
		)
	}

	return (
		<div className="h-full flex flex-col justify-center flex-1 min-h-0 items-center relative">
			{/** biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
			{/** biome-ignore lint/a11y/useKeyWithClickEvents: backdrop */}
			<div className="absolute inset-0" onClick={closeViewer}></div>
			{contentDisplay}
		</div>
	)
}
