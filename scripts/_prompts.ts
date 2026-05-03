import z from "zod"

const txt = `Generate some realistic content for a dummy file for an insurance-focused content management system demo. The document should include an executive summary, key findings, detailed analysis, and a conclusion. Use a formal and professional tone, and include relevant data points and metrics where appropriate. The content should be comprehensive and suitable for internal use by executives and stakeholders. Only generate the content, do not include any explanations or Markdown formatting. Do not include the filename in the content. The document should be approximately 500 words in length. The document is called "{filename}".`

export type PdfSchema = z.infer<typeof PdfSchema>
export const PdfSchema = z.object({
	documentContent: z.array(
		z.union([
			z.object({
				type: z.enum(["h1", "h2", "h3", "p"]),
				content: z.string(),
			}),
			z.object({
				type: z.enum(["ul", "ol"]),
				items: z.array(z.string()),
			}),
			z.object({
				type: z.literal("table"),
				headers: z.array(z.string()),
				rows: z.array(z.array(z.string())),
			}),
			z.object({
				type: z.literal("pagebreak"),
			}),
		])
	),
})

const pdf = `Generate some realistic content in JSON format for a dummy PDF document for a insurance-focused content management system demo. This is one of many documents. Use a formal and professional tone, and include relevant data points and metrics where appropriate. The content should be comprehensive and suitable for internal use by executives and stakeholders. Only generate the JSON-formatted content, do not include any explanations. Do not include the filename in the content. The document should be approximately 500 words in length.

Adhere to the following JSON schema:

${JSON.stringify(PdfSchema.toJSONSchema(), null, 2)}

The document is called "{filename}".
`

export type DocxSchema = z.infer<typeof DocxSchema>
export const DocxSchema = z.object({
	documentContent: z.array(
		z.union([
			z.object({
				type: z.enum(["h1", "h2", "h3", "p"]),
				content: z.string(),
			}),
			z.object({
				type: z.enum(["ul", "ol"]),
				items: z.array(z.string()),
			}),
			z.object({
				type: z.literal("table"),
				headers: z.array(z.string()),
				rows: z.array(z.array(z.string())),
			}),
			z.object({
				type: z.literal("pagebreak"),
			}),
		])
	),
})

const docx = `Generate some realistic content in JSON format for a dummy Word document (DOCX) called "{filename}" for an insurance-focused content management system demo. Use a formal and professional tone, and include relevant data points and metrics where appropriate. The content should be comprehensive and suitable for internal use by executives and stakeholders. Feel free to structure it with headings, paragraphs, lists, and tables. Only generate the JSON-formatted content, do not include any explanations. Do not include the filename in the content. The document should be approximately 500 words in length.

Adhere to the following JSON schema:

${JSON.stringify(DocxSchema.toJSONSchema(), null, 2)}
`

export type XlsxSchema = z.infer<typeof XlsxSchema>
export const XlsxSchema = z.object({
	documentContent: z.array(
		z.object({
			name: z
				.string()
				.describe("The name of the worksheet, e.g., 'Summary', 'Data', 'Q3 Performance'"),
			headers: z.array(z.string()).describe("The column headers for the data in the sheet"),
			rows: z
				.array(z.array(z.union([z.string(), z.number()])))
				.describe("The rows of data, matching the number of headers"),
		})
	),
})

const xlsx = `Generate some realistic content in JSON format for a dummy Excel spreadsheet (XLSX) for an insurance-focused content management system demo. Use a formal and professional tone, and include relevant data points and metrics where appropriate. Structure the workbook with 2 to 4 sheets, providing meaningful sheet names, column headers, and 10 to 30 rows of data per sheet. The content should be comprehensive and suitable for internal use by executives and stakeholders. Only generate the JSON-formatted content, do not include any explanations. Do not include the filename in the content.

Adhere to the following JSON schema:

${JSON.stringify(XlsxSchema.toJSONSchema(), null, 2)}

The document is called "{filename}".
`

export type PptxSchema = z.infer<typeof PptxSchema>
export const PptxSchema = z.object({
	documentContent: z.array(
		z.object({
			title: z.string().describe("The title of the slide"),
			content: z
				.array(
					z.union([
						z.object({
							type: z.enum(["p"]),
							content: z.string(),
						}),
						z.object({
							type: z.enum(["ul", "ol"]),
							items: z.array(z.string()),
						}),
					])
				)
				.describe("The content of the slide, consisting of paragraphs and lists"),
		})
	),
})

const pptx = `Generate some realistic content in JSON format for a dummy PowerPoint presentation (PPTX) for an insurance-focused content management system demo. Use a formal and professional tone, and include relevant data points and metrics where appropriate. Structure the presentation with 5 to 10 slides, providing a title and concise content (paragraphs and bullet points) for each slide. The content should be suitable for a presentation to executives and stakeholders. Only generate the JSON-formatted content, do not include any explanations. Do not include the filename in the content.

Adhere to the following JSON schema:

${JSON.stringify(PptxSchema.toJSONSchema(), null, 2)}

The document is called "{filename}".
`

export const prompts = {
	txt: (filename: string) => txt.replace("{filename}", filename),
	pdf: (filename: string) => pdf.replace("{filename}", filename),
	docx: (filename: string) => docx.replace("{filename}", filename),
	xlsx: (filename: string) => xlsx.replace("{filename}", filename),
	pptx: (filename: string) => pptx.replace("{filename}", filename),
} as const
