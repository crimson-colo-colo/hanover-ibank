import { ActionIcon, Flex, Image, ScrollArea } from "@mantine/core"
import { ContentType } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"
import {
	IconChevronDown,
	IconChevronUp,
	IconLoader2,
	IconZoomIn,
	IconZoomOut,
} from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import worker from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { createContext, useContext, useRef, useState } from "react"
import { Document, type LinkService, Page, pdfjs } from "react-pdf"
import { formatBytes } from "@/lib/content.ts"
import { trpc } from "@/lib/trpc.ts"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import clsx from "clsx"
import type { ScrollPageIntoViewArgs } from "react-pdf/dist/shared/types.js"
import { URLCard } from "@/components/URLCard.tsx"
import type { ContentListItem } from "../../server/routers/content.ts"

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
	insideModal = true,
}: {
	content: ContentListItem
	fileType: FileType
	closeViewer: () => void
	children: React.ReactNode
	insideModal?: boolean
}) {
	const { data: contentPreview, isFetching } = useQuery(
		trpc.preview.getContentUrl.queryOptions(
			{ id: content.id },
			{ enabled: content.type === ContentType.Object }
		)
	)
	const { data: plaintextContent, isFetching: isPlaintextFetching } = useQuery(
		trpc.preview.getPlaintextContent.queryOptions(
			{ id: content.id },
			{ enabled: fileType === FileType.Plaintext }
		)
	)

	const [numPages, setNumPages] = useState<number>()
	const [scale, setScale] = useState(1)
	const [currentPage, setCurrentPage] = useState(1)

	const scales = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

	function onLoadSuccess({ numPages }: { numPages: number }): void {
		setNumPages(numPages)
	}

	const documentRef = useRef<{
		linkService: React.RefObject<LinkService>
		pages: React.RefObject<HTMLDivElement[]>
		viewer: React.RefObject<{
			scrollPageIntoView: (args: ScrollPageIntoViewArgs) => void
		}>
	}>(null)
	const scrollRef = useRef<HTMLDivElement>(null)

	function onScroll(pos: { x: number; y: number }) {
		if (!documentRef.current) {
			return
		}

		const { pages } = documentRef.current
		if (!pages.current) {
			return
		}

		// Find the page whose top is closest to the current scroll position
		const pageTops = pages.current.map((page) => page.offsetTop)
		const closestPageIndex = pageTops.reduce((closestIndex, pageTop, index) => {
			const closestPageTop = pageTops[closestIndex]
			return Math.abs(pageTop - pos.y) < Math.abs(closestPageTop - pos.y) ? index : closestIndex
		}, 0)

		setCurrentPage(closestPageIndex + 1)
	}

	let controls: React.ReactNode
	let preview: React.ReactNode

	if (isFetching || isPlaintextFetching) {
		preview = (
			<IconLoader2
				className={clsx("animate-spin", insideModal ? "text-white" : "dark:text-white")}
				size={40}
			/>
		)
	} else if (content.type === "Link") {
		preview = <URLCard url={content.url} />
	} else if (fileType === FileType.Image) {
		preview = (
			<Image
				src={contentPreview?.url}
				alt={content.title}
				className="object-contain w-full h-full z-10"
			/>
		)
	} else if (fileType === FileType.Audio) {
		preview = (
			// biome-ignore lint/a11y/useMediaCaption: user generated content
			<audio controls src={contentPreview?.url} className="w-full max-w-200 z-10"></audio>
		)
	} else if (fileType === FileType.Video) {
		preview = (
			// biome-ignore lint/a11y/useMediaCaption: user generated content
			<video controls src={contentPreview?.url} className="w-full z-10"></video>
		)
	} else if (fileType === FileType.Plaintext) {
		preview = plaintextContent?.text ? (
			<ScrollArea
				className={clsx(
					"w-full h-full bg-white rounded-md dark:bg-[#242424] z-10",
					!insideModal && "border border-gray-200 dark:border-gray-800 mt-4"
				)}
			>
				<pre className="whitespace-pre-wrap m-0 text-sm p-4">{plaintextContent.text}</pre>
			</ScrollArea>
		) : (
			<div className="w-full h-full flex items-center justify-center p-4 bg-white rounded-md dark:bg-[#242424]">
				<IconLoader2 className="animate-spin" size={48} />
			</div>
		)
	} else if (
		fileType === FileType.Pdf ||
		fileType === FileType.WordDocument ||
		fileType === FileType.Excel ||
		fileType === FileType.Powerpoint
	) {
		controls = (
			<>
				<Flex align="center" className="gap-3 w-max">
					<ActionIcon
						variant="transparent"
						onClick={() => setScale((prev) => scales[Math.max(0, scales.indexOf(prev) - 1)])}
					>
						<IconZoomOut />
					</ActionIcon>
					<span className="w-10 text-right">{Math.round(scale * 100)}%</span>
					<ActionIcon
						variant="transparent"
						onClick={() =>
							setScale((prev) => scales[Math.min(scales.length - 1, scales.indexOf(prev) + 1)])
						}
					>
						<IconZoomIn />
					</ActionIcon>
				</Flex>

				{numPages && (
					<Flex align="center" className="gap-3">
						<ActionIcon
							variant="transparent"
							onClick={() => {
								documentRef.current?.viewer.current?.scrollPageIntoView({
									pageNumber: currentPage - 1,
								})
							}}
						>
							<IconChevronUp />
						</ActionIcon>
						<div>
							Page {currentPage} of {numPages}
						</div>
						<ActionIcon
							variant="transparent"
							onClick={() => {
								documentRef.current?.viewer.current?.scrollPageIntoView({
									pageNumber: currentPage + 1,
								})
							}}
						>
							<IconChevronDown />
						</ActionIcon>
					</Flex>
				)}
			</>
		)
		preview = (
			<ScrollArea
				className="relative flex flex-col items-center justify-center flex-1 h-full max-w-full min-w-0 min-h-0 z-10 overflow-visible"
				offsetScrollbars="y"
				viewportRef={scrollRef}
				onScrollPositionChange={onScroll}
			>
				<Document
					file={contentPreview?.url}
					options={options}
					onLoadSuccess={onLoadSuccess}
					className={clsx("flex flex-col items-center gap-4", !insideModal && "mt-4")}
					ref={documentRef}
					loading={() => (
						<IconLoader2
							className={clsx("animate-spin", insideModal ? "text-white" : "dark:text-white")}
							size={40}
						/>
					)}
				>
					{new Array(numPages).fill(0).map((_, index) => (
						<Page
							// biome-ignore lint/suspicious/noArrayIndexKey: foo
							key={index}
							pageNumber={index + 1}
							scale={scale}
							loading={() => (
								<div className="w-full h-96 flex items-center justify-center">
									<IconLoader2
										className={clsx("animate-spin", insideModal ? "text-white" : "dark:text-white")}
										size={24}
									/>
								</div>
							)}
						/>
					))}
				</Document>
			</ScrollArea>
		)
	}

	return (
		<FilePreviewContext.Provider
			value={{
				controls: (
					<Flex align="center" className="gap-8 ml-4 shrink-0 mr-4">
						{content.type === ContentType.Object && content.object?.ContentLength !== undefined && (
							<span className="mr-4 text-gray-600">
								{formatBytes(content.object.ContentLength)}
							</span>
						)}

						{controls}
					</Flex>
				),
				preview: (
					<div className="relative flex flex-col items-center justify-center flex-1 h-full min-w-0 min-h-0 shrink @container">
						{insideModal && (
							// biome-ignore lint/a11y/noStaticElementInteractions: backdrop
							// biome-ignore lint/a11y/useKeyWithClickEvents: backdrop
							<div className="absolute inset-0 z-0" onClick={closeViewer}></div>
						)}
						{preview}
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
