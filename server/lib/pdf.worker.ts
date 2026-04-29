import * as Comlink from "comlink"
import scribe from "scribe.js-ocr"

export type RecognitionSettings = {
	skipRecPDFTextNative: boolean
	skipRecPDFTextOCR: boolean
}

export type JobOptions = {
	buffer: ArrayBuffer
	settings: RecognitionSettings
}

export type JobResult = { ok: true; text: string } | { ok: false; error: string }

const scribeReady = scribe.init({ ocr: true, pdf: true, font: true })

export interface PDFWorker {
	extractText(options: JobOptions): Promise<JobResult>
}

async function extractText(options: JobOptions): Promise<JobResult> {
	await scribeReady
	try {
		const file = new File([options.buffer], "file.pdf", { type: "application/pdf" })
		const result = await scribe.extractText([file], ["eng"], "text", {
			skipRecPDFTextNative: options.settings.skipRecPDFTextNative,
			skipRecPDFTextOCR: options.settings.skipRecPDFTextOCR,
		})
		return { ok: true, text: result.toString() }
	} catch (err) {
		return { ok: false, error: String(err) }
	}
}

Comlink.expose({ extractText })
