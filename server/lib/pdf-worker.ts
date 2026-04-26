import scribe from "scribe.js-ocr"

await scribe.init({ ocr: true, pdf: true, font: true })
// @ts-expect-error
self.postMessage({ ready: true })

// @ts-expect-error
self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
	try {
		const file = new File([event.data], "file.pdf", { type: "application/pdf" })
		const result = await scribe.extractText([file], ["eng"], "text", {
			skipRecPDFTextNative: false,
			skipRecPDFTextOCR: false,
		})
		// @ts-expect-error
		self.postMessage({ ok: true, text: result.toString() })
	} catch (err) {
		// @ts-expect-error
		self.postMessage({ ok: false, error: String(err).toString() })
	}
}
