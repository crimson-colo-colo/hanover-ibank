import scribe from "scribe.js-ocr"

type RecognitionSettings = {
	skipRecPDFTextNative: boolean
	skipRecPDFTextOCR: boolean
}

type WorkerMessage = {
	buffer: ArrayBuffer
	settings: RecognitionSettings
}

await scribe.init({ ocr: true, pdf: true, font: true })
// @ts-expect-error
self.postMessage({ ready: true })

// @ts-expect-error
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
	try {
		const file = new File([event.data.buffer], "file.pdf", { type: "application/pdf" })
		const result = await scribe.extractText([file], ["eng"], "text", {
			skipRecPDFTextNative: event.data.settings.skipRecPDFTextNative,
			skipRecPDFTextOCR: event.data.settings.skipRecPDFTextOCR,
		})
		// @ts-expect-error
		self.postMessage({ ok: true, text: result.toString() })
	} catch (err) {
		// @ts-expect-error
		self.postMessage({ ok: false, error: String(err).toString() })
	}
}
