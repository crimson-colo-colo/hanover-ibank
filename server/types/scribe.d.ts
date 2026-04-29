declare module "scribe.js-ocr" {
	export interface AddHighlightsResult {
		highlightsApplied: number
		totalLinesHighlighted: number
	}

	export interface AnnotationHighlight {
		bbox: Bbox
		color: string
		comment?: string
		groupId: string
		opacity: number
		quads?: Bbox[]
	}

	export interface Bbox {
		bottom: number
		left: number
		right: number
		top: number
	}
	export interface CompareOCRResult {
		debug: unknown[][]
		metrics: (EvalMetrics | null)[]
		ocr: OcrPage[]
	}

	export interface DataNamespace {
		annotations: { pages: AnnotationHighlight[][] } & Record<string, unknown>
		debug: Record<string, unknown>
		font: Record<string, unknown>
		image: Record<string, unknown>
		layoutDataTables: { pages: LayoutDataTablePage[] } & Record<string, unknown>
		layoutRegions: { pages: LayoutPage[] } & Record<string, unknown>
		ocr: { active: OcrPage[] } & Record<string, OcrPage[]>
		ocrRaw: { active: string[] } & Record<string, string[]>
		pageMetrics: PageMetrics[]
		vis: Record<string, unknown>
	}

	export interface Dims {
		height: number
		width: number
	}

	export interface EvalMetrics {
		correct: number
		correctLowConf: number
		extra: number
		incorrect: number
		incorrectHighConf: number
		missed: number
		total: number
	}

	export interface ExtractTextOptions {
		skipRecPDFTextNative?: boolean
		skipRecPDFTextOCR?: boolean
	}

	export interface FileNode {
		arrayBuffer(): Promise<ArrayBuffer>
		name: string
		size: number
		text(): Promise<string>
		type: string
	}
	export interface HighlightSpec {
		color?: string
		comment?: string
		endLine?: number
		opacity?: number
		page: number
		startLine?: number
		text?: string
	}

	export type InclusionLevel = "line" | "word" | string

	export type InclusionRule = "left" | "majority" | string

	export interface InitParams {
		font?: boolean
		ocr?: boolean
		ocrParams?: Record<string, unknown>
		pdf?: boolean
	}

	export interface InputDataState {
		defaultDownloadFileName: string
		evalMode: boolean
		imageMode: boolean
		inputFileNames: string[]
		pageCount: number
		pdfMode: boolean
		pdfType: "text" | "ocr" | "image" | null
		resumeMode: boolean
		xmlMode: boolean[]
	}

	export interface LayoutBoxBase {
		coords: Bbox
		id: string
		inclusionLevel: InclusionLevel
		inclusionRule: InclusionRule
	}

	export interface LayoutDataColumn extends LayoutBoxBase {
		type: "dataColumn"
	}

	export interface LayoutDataTable {
		boxes: LayoutDataColumn[]
		id: string
		rowBounds: number[] | null
	}

	export interface LayoutDataTablePage {
		default: boolean
		n: number
		tables: LayoutDataTable[]
	}

	export interface LayoutPage {
		boxes: Record<string, LayoutRegion>
		default: boolean
		n: number
	}

	export interface LayoutRegion extends LayoutBoxBase {
		order: number
		type: "order" | "exclude"
	}

	export interface OcrChar {
		bbox: Bbox
		text: string
	}

	export interface OcrLine {
		ascHeight: number | null
		baseline: [number, number]
		bbox: Bbox
		id: string
		orientation: 0 | 1 | 2 | 3
		words: OcrWord[]
		xHeight: number | null
	}

	export interface OcrPage {
		angle: number
		dims: Dims
		lines: OcrLine[]
		n: number
		pars: OcrPar[]
		textSource: TextSource
	}

	export interface OcrPar {
		bbox: Bbox
		footnoteRefId: string | null
		id: string
		lines: OcrLine[]
		parNum: string | null
		type: ParType
	}

	export interface OcrWord {
		bbox: Bbox
		chars: OcrChar[] | null
		compTruth: boolean
		conf: number
		footnoteParId: string | null
		id: string
		lang: string
		matchTruth: boolean
		poly: Polygon | null
		style: WordStyle
		text: string
		textAlt: string | null
		visualCoords: boolean
	}

	export interface PageMetrics {
		angle: number | null
		dims: Dims
		left: number | null
		manAdj: number
	}

	export interface PageRangeOptions {
		maxPage?: number
		minPage?: number
		pageArr?: number[] | null
	}

	export type ParType = "body" | "footnote" | "title"

	export interface Point {
		x: number
		y: number
	}

	export interface Polygon {
		bl: Point
		br: Point
		tl: Point
		tr: Point
	}

	export type ProgressMessage =
		| ProgressMessageConvert
		| ProgressMessageGeneral
		| ProgressMessageRecognize

	export interface ProgressMessageConvert {
		info: { engineName: string }
		n: number
		type: "convert"
	}

	export interface ProgressMessageGeneral {
		info: Record<string, never>
		n: number
		type: "export" | "importImage" | "importPDF" | "render"
	}

	export interface ProgressMessageRecognize {
		info?: {
			elapsedMs?: number
			engineName?: string
			responsesReceived?: number
			status?: string
			timestamp?: number
		}
		n?: number
		type: "recognize"
	}

	export interface RecognitionModel {
		config: RecognitionModelConfig
		convertPage?: (
			rawData: string,
			n: number
		) => Promise<{
			dataTables: LayoutDataTablePage
			fontSet: Set<string>
			langSet: Set<string>
			pageObj: OcrPage
			warn: object
		}>
		isThrottlingError?: (error: Error) => boolean
		recognizeDocument?: (
			documentData: {
				pageCount: number
				pageDims: Dims[]
				pdfBytes: ArrayBuffer | null
			},
			options?: Record<string, unknown>
		) => Promise<AsyncIterable<{ n: number; rawData: string } | null>>
		recognizeImage(
			imageData: Uint8Array | ArrayBuffer,
			options?: Record<string, unknown>
		): Promise<RecognitionResult>
	}

	export interface RecognitionModelConfig {
		name: string
		outputFormat: RecognitionOutputFormat | null
		rateLimit?: { tps: number } | { rpm: number }
	}

	export type RecognitionOutputFormat =
		| "abbyy"
		| "alto"
		| "azure_doc_intel"
		| "google_doc_ai"
		| "google_vision"
		| "hocr"
		| "stext"
		| "textract"
		| "text"

	export interface RecognitionResult {
		error?: Error
		format: RecognitionOutputFormat | string
		rawData?: string
		success: boolean
	}

	export interface RecognizeOptions {
		combineMode?: "data" | "conf" | "none"
		config?: Record<string, string>
		langs?: string[]
		mode?: "quality" | "speed"
		modeAdv?: "combined" | "legacy" | "lstm"
		model?: RecognitionModel
		modelOptions?: Record<string, unknown>
		signal?: AbortSignal
		vanillaMode?: boolean
	}

	export interface RuntimeOptions {
		addOverlay: boolean
		autoRotate: boolean
		calcSuppFontInfo: boolean
		colorMode: "color" | "gray" | "binary"
		compressScribe: boolean
		confThreshHigh: number
		confThreshMed: number
		debugVis: boolean
		displayMode: "proof" | "ebook" | "eval" | "invis" | "annot"
		docxLineSplitMode: "width" | "sentence"
		enableFontOpt: boolean
		enableLayout: boolean
		enableUpscale: boolean
		errorHandler: (msg: string) => void
		extractPDFFonts: boolean
		extractText: boolean
		humanReadablePDF: boolean
		ignoreCap: boolean
		ignoreExtra: boolean
		ignorePunct: boolean
		includeExtraTextScribe: boolean
		includeImages: boolean
		intermediatePDF: boolean
		keepPDFTextAlways: boolean
		keepRawData: boolean
		kerning: boolean
		ligatures: boolean
		lineNumbers: boolean
		omitNativeText: boolean
		overlayOpacity: number
		pageBreaks: boolean
		printRecognitionTime: boolean
		progressHandler: (msg: ProgressMessage) => void
		reflow: boolean
		removeMargins: boolean
		saveDebugImages: boolean
		standardizePageSize: boolean
		usePDFText: {
			native: { main: boolean; supp: boolean }
			ocr: { main: boolean; supp: boolean }
		}
		warningHandler: (msg: string) => void
		workerN: number | null
		xlsxFilenameColumn: boolean
		xlsxPageNumberColumn: boolean
	}

	export interface ScribeAPI {
		addHighlights(highlights: HighlightSpec[]): AddHighlightsResult
		clear(): Promise<void>
		clearHighlights(groupId?: string): void
		combineOCRPage(
			pageA: OcrPage,
			pageB: OcrPage,
			pageMetrics: PageMetrics,
			replaceFontSize?: boolean,
			editWordIds?: boolean
		): void
		compareOCR(
			ocrA: OcrPage[],
			ocrB: OcrPage[],
			options?: Record<string, unknown>,
			progressCallback?: (() => void) | null
		): Promise<CompareOCRResult>
		convertOCRPage(
			ocrRaw: string,
			n: number,
			mainData: boolean,
			format: TextSource,
			engineName: string,
			scribeMode?: boolean
		): Promise<void>
		createTablesFromText(page?: number): void
		data: DataNamespace
		download(format: ScribeFormat, fileName: string, options?: PageRangeOptions): Promise<void>
		enableFontOpt(enable: boolean): Promise<void>
		evalOCRPage(params: {
			func?: ((wordA: OcrWord, wordB: OcrWord) => void) | null
			page: OcrPage | OcrLine
			view?: boolean
		}): Promise<EvalMetrics>
		exportData(format?: ScribeFormat, options?: PageRangeOptions): Promise<string | ArrayBuffer>
		extractInternalPDFText(
			file: ScribeInputFile,
			options?: Record<string, unknown>
		): Promise<string | null>
		extractText(
			files: ScribeInputFile[] | FileList | SortedInputFiles,
			langs?: string[],
			outputFormat?: ScribeFormat,
			options?: ExtractTextOptions
		): Promise<string | ArrayBuffer>
		extractTextFromTables(page?: number): Record<string, string[][]> | Record<string, string[][]>[]
		importFiles(files: ScribeInputFile[] | FileList | SortedInputFiles): Promise<void>
		importFilesSupp(files: ScribeInputFile[] | FileList | SortedInputFiles): Promise<void>
		init(params?: InitParams): Promise<void>
		inputData: InputDataState
		layout: Record<string, unknown>
		opt: RuntimeOptions
		recognize(options?: RecognizeOptions): Promise<void>
		terminate(): Promise<void>
		utils: UtilsNamespace
	}

	export type ScribeFormat =
		| "alto"
		| "docx"
		| "hocr"
		| "html"
		| "md"
		| "pdf"
		| "scribe"
		| "text"
		| "txt"
		| "xlsx"

	export type ScribeInputFile = string | URL | File | Blob | ArrayBuffer | Uint8Array | FileNode
	export interface SortedInputFiles {
		imageFiles?: ScribeInputFile[]
		ocrFiles?: ScribeInputFile[]
		pdfFiles?: ScribeInputFile[]
		scribeFiles?: ScribeInputFile[]
	}

	export type TextSource =
		| null
		| "abbyy"
		| "alto"
		| "azure_doc_intel"
		| "docx"
		| "google_doc_ai"
		| "google_vision"
		| "hocr"
		| "stext"
		| "tesseract"
		| "textract"
		| "text"
	export interface WordStyle {
		bold: boolean
		dropcap: boolean
		font: string | null
		italic: boolean
		size: number | null
		smallCaps: boolean
		sup: boolean
		underline: boolean
	}

	declare const scribe: ScribeAPI
	export default scribe
}
