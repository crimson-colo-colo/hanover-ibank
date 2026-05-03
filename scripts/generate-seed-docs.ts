// This script generates a variety of seed documents (TXT, CSV, PDF, DOCX, XLSX,
// PPTX) with random content using the Faker library and an LLM. It also
// downloads sample media files (images, video, audio).

// This script was generated using an AI assistant with permission from the
// professor.

import fs from "node:fs"
import path from "node:path"
import { faker } from "@faker-js/faker"
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow } from "docx"
import ExcelJS from "exceljs"
import pLimit from "p-limit"
import PDFDocument from "pdfkit"
import PptxGenJS from "pptxgenjs"
import { generate, seed } from "./_generate.ts"
import { DocxSchema, PdfSchema, PptxSchema, prompts, XlsxSchema } from "./_prompts.ts"

const OUTPUT_DIR = path.join(process.cwd(), "prisma", "seed-data", "generated")
const TOPICS = fs
	.readFileSync(path.join(process.cwd(), "prisma", "seed-data", "topics.txt"), "utf-8")
	.split("\n")
	.filter(Boolean)

const COUNT_PER_DOCUMENT_TYPE = 40
const COUNT_PER_MEDIA_TYPE = 10

async function ensureDir() {
	if (fs.existsSync(OUTPUT_DIR)) {
		fs.rmSync(OUTPUT_DIR, { recursive: true, force: true })
	}
	fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

function getRandomTopic() {
	return faker.helpers.arrayElement(TOPICS)
}

function getFilename(topic: string, ext: string) {
	const year = faker.date.past().getFullYear()
	const quarter = faker.helpers.arrayElement(["Q1", "Q2", "Q3", "Q4"])
	const version = faker.number.int({ min: 1, max: 5 })
	const docType = faker.helpers.arrayElement([
		"Report",
		"Summary",
		"Analysis",
		"Draft",
		"Final",
		"Review",
	])
	const safeTopic = topic.replace(/\//g, "-")
	return `${safeTopic} ${docType} ${year} ${quarter} v${version}.${ext}`
}

async function generateTxt(concurrency: number) {
	const limit = pLimit(concurrency)
	faker.seed(seed)
	await Promise.all(
		Array.from({ length: COUNT_PER_DOCUMENT_TYPE }, () => {
			const topic = getRandomTopic()
			const filename = getFilename(topic, "txt")
			return limit(async () => {
				const res = await generate({ prompt: prompts.txt(filename) })
				console.log(`Generated content for ${filename} in ${res.total_duration / 1e9} seconds`)
				fs.writeFileSync(path.join(OUTPUT_DIR, filename), res.message.content)
			})
		})
	)
}

async function generateCsv() {
	faker.seed(seed + 1)
	for (let i = 0; i < COUNT_PER_DOCUMENT_TYPE; i++) {
		const topic = getRandomTopic()
		const filename = getFilename(topic, "csv")
		let content =
			"TransactionID,Date,Department,Category,Description,Amount,Currency,Status,Assignee\n"
		const rowCount = faker.number.int({ min: 15, max: 150 })
		for (let j = 0; j < rowCount; j++) {
			content += `${faker.string.uuid()},${faker.date.recent().toISOString().split("T")[0]},${faker.commerce.department()},${topic},${faker.commerce.productName()},${faker.finance.amount()},${faker.finance.currencyCode()},${faker.helpers.arrayElement(["Pending", "Approved", "Denied", "In Review"])},${faker.person.fullName()}\n`
		}
		fs.writeFileSync(path.join(OUTPUT_DIR, filename), content)
	}
}

async function generatePdf(concurrency: number) {
	faker.seed(seed + 2)
	const limit = pLimit(concurrency)
	await Promise.all(
		Array.from({ length: COUNT_PER_DOCUMENT_TYPE }, () => {
			const topic = getRandomTopic()
			const filename = getFilename(topic, "pdf")
			return limit(async () => {
				const content = await generate({ prompt: prompts.pdf(filename), schema: PdfSchema })
				const doc = new PDFDocument()
				doc.pipe(fs.createWriteStream(path.join(OUTPUT_DIR, filename)))
				console.log(`Generated content for ${filename} in ${content.total_duration / 1e9} seconds`)

				const response = PdfSchema.parse(JSON.parse(content.message.content))

				for (const item of response.documentContent) {
					try {
						switch (item.type) {
							case "h1":
								doc.fontSize(24).text(item.content, { underline: true })
								break
							case "h2":
								doc.fontSize(20).text(item.content, { underline: true })
								break
							case "h3":
								doc.fontSize(16).text(item.content, { underline: true })
								break
							case "p":
								doc.fontSize(12).text(item.content)
								break
							case "ul":
								item.items.forEach((line) => {
									doc.fontSize(12).text(`• ${line}`)
								})
								break
							case "ol":
								item.items.forEach((line, index) => {
									doc.fontSize(12).text(`${index + 1}. ${line}`)
								})
								break
							case "table": {
								const tableTop = doc.y
								const cellPadding = 5

								const columnWidths = item.headers.map(() => 150)
								// Render headers
								item.headers.forEach((header, index) => {
									doc
										.rect(doc.x + index * columnWidths[index], tableTop, columnWidths[index], 20)
										.stroke()
									doc.text(
										header,
										doc.x + index * columnWidths[index] + cellPadding,
										tableTop + cellPadding
									)
								})
								// Render rows
								item.rows.forEach((row, rowIndex) => {
									const rowTop = tableTop + 20 + rowIndex * 20
									row.forEach((cell, cellIndex) => {
										doc
											.rect(
												doc.x + cellIndex * columnWidths[cellIndex],
												rowTop,
												columnWidths[cellIndex],
												20
											)
											.stroke()
										doc.text(
											cell,
											doc.x + cellIndex * columnWidths[cellIndex] + cellPadding,
											rowTop + cellPadding
										)
									})
								})
								break
							}
							case "pagebreak":
								doc.addPage()
								break
						}
					} catch {}
				}

				doc.end()
			})
		})
	)
}

async function generateDocx(concurrency: number) {
	faker.seed(seed + 3)
	const limit = pLimit(concurrency)
	await Promise.all(
		Array.from({ length: COUNT_PER_DOCUMENT_TYPE }, () => {
			const topic = getRandomTopic()
			const filename = getFilename(topic, "docx")
			return limit(async () => {
				const res = await generate({ prompt: prompts.docx(filename), schema: DocxSchema })
				console.log(`Generated content for ${filename} in ${res.total_duration / 1e9} seconds`)

				const response = DocxSchema.parse(JSON.parse(res.message.content))

				const docxChildren: any[] = []

				for (const item of response.documentContent) {
					try {
						switch (item.type) {
							case "h1":
								docxChildren.push(
									new Paragraph({ text: item.content, heading: HeadingLevel.HEADING_1 })
								)
								break
							case "h2":
								docxChildren.push(
									new Paragraph({ text: item.content, heading: HeadingLevel.HEADING_2 })
								)
								break
							case "h3":
								docxChildren.push(
									new Paragraph({ text: item.content, heading: HeadingLevel.HEADING_3 })
								)
								break
							case "p":
								docxChildren.push(new Paragraph({ text: item.content }))
								break
							case "ul":
								item.items.forEach((line) => {
									docxChildren.push(new Paragraph({ text: line, bullet: { level: 0 } }))
								})
								break
							case "ol":
								item.items.forEach((line, index) => {
									docxChildren.push(new Paragraph({ text: `${index + 1}. ${line}` }))
								})
								break
							case "table":
								docxChildren.push(
									new Table({
										rows: [
											new TableRow({
												children: item.headers.map(
													(header) => new TableCell({ children: [new Paragraph(header)] })
												),
											}),
											...item.rows.map(
												(row) =>
													new TableRow({
														children: row.map(
															(cell) => new TableCell({ children: [new Paragraph(cell)] })
														),
													})
											),
										],
									})
								)
								break
							case "pagebreak":
								docxChildren.push(new Paragraph({ pageBreakBefore: true }))
								break
						}
					} catch {}
				}

				const doc = new Document({
					sections: [
						{
							children: docxChildren,
						},
					],
				})
				const buffer = await Packer.toBuffer(doc)
				fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer)
			})
		})
	)
}

function toTitleCase(str: string) {
	return str
		.toLowerCase()
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")
}

async function generateXlsx(concurrency: number) {
	faker.seed(seed + 4)
	const limit = pLimit(concurrency)
	await Promise.all(
		Array.from({ length: COUNT_PER_DOCUMENT_TYPE }, () => {
			const topic = getRandomTopic()
			const filename = getFilename(topic, "xlsx")
			return limit(async () => {
				const res = await generate({ prompt: prompts.xlsx(filename), schema: XlsxSchema })
				console.log(`Generated content for ${filename} in ${res.total_duration / 1e9} seconds`)

				const response = XlsxSchema.parse(JSON.parse(res.message.content))

				const workbook = new ExcelJS.Workbook()

				for (const sheetData of response.documentContent) {
					const cleanName = sheetData.name.slice(0, 31).replace(/[*?/\\[\]]/g, "")
					const sheet = workbook.addWorksheet(cleanName || "Data")

					sheet.columns = sheetData.headers.map((header) => ({
						header,
						key: header.toLowerCase().replace(/[^a-z0-9]/g, ""),
						width: 25,
					}))

					for (const row of sheetData.rows) {
						const rowData: Record<string, any> = {}
						sheetData.headers.forEach((header, index) => {
							rowData[header.toLowerCase().replace(/[^a-z0-9]/g, "")] = row[index]
						})
						sheet.addRow(rowData)
					}

					sheet.getRow(1).font = { bold: true }
				}

				await workbook.xlsx.writeFile(path.join(OUTPUT_DIR, filename))
			})
		})
	)
}

const backgroundColors = [
	"ACC8E5",
	"F9D5E5",
	"B5EAEA",
	"F1F1F1",
	"FFE156",
	"6A0572",
	"AB83A1",
	"FF6B6B",
	"4ECDC4",
	"C7F464",
]
async function generatePptx(concurrency: number) {
	faker.seed(seed + 5)
	const limit = pLimit(concurrency)
	await Promise.all(
		Array.from({ length: COUNT_PER_DOCUMENT_TYPE }, () => {
			const topic = getRandomTopic()
			const filename = getFilename(topic, "pptx")
			const bg = faker.helpers.arrayElement(backgroundColors)
			return limit(async () => {
				const res = await generate({ prompt: prompts.pptx(filename), schema: PptxSchema })
				console.log(`Generated content for ${filename} in ${res.total_duration / 1e9} seconds`)

				const response = PptxSchema.parse(JSON.parse(res.message.content))

				const pres = new PptxGenJS()

				for (const slideData of response.documentContent) {
					const slide = pres.addSlide()
					slide.background = { color: bg }

					slide.addText(slideData.title, {
						x: 1,
						y: 0.5,
						fontSize: 32,
						color: "363636",
						bold: true,
					})

					let currentY = 1.5
					for (const contentItem of slideData.content) {
						if (contentItem.type === "p") {
							slide.addText(contentItem.content, { x: 1, y: currentY, fontSize: 18 })
							currentY += 1
						} else if (contentItem.type === "ul" || contentItem.type === "ol") {
							const textArray = contentItem.items.map((item) => ({
								text: item,
								options: { bullet: true },
							}))
							slide.addText(textArray, { x: 1, y: currentY, fontSize: 18 })
							currentY += contentItem.items.length * 0.4 + 0.5
						}
					}
				}

				await pres.writeFile({ fileName: path.join(OUTPUT_DIR, filename) })
			})
		})
	)
}

async function downloadMedia() {
	faker.seed(seed + 6)
	const mediaTypes = [
		{
			ext: "jpg",
			url: () =>
				faker.helpers.arrayElement([
					`https://picsum.photos/1200/800`,
					"https://picsum.photos/1920/1080",
					"https://picsum.photos/800/600",
				]),
		},
		{
			ext: "mp4",
			url: () =>
				faker.helpers.arrayElement([
					"https://www.w3schools.com/html/mov_bbb.mp4",
					"https://www.w3schools.com/html/movie.mp4",
					"https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
				]),
		},
		{
			ext: "mp3",
			url: () =>
				faker.helpers.arrayElement([
					"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
					"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
					"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
				]),
		},
	]

	const promises: Promise<void>[] = []

	for (const media of mediaTypes) {
		for (let i = 0; i < COUNT_PER_MEDIA_TYPE; i++) {
			promises.push(
				(async () => {
					const topic = getRandomTopic()
					const filename = getFilename(topic, media.ext)
					const targetUrl = media.url()
					const response = await fetch(targetUrl)
					if (response.ok) {
						const buffer = await response.arrayBuffer()
						fs.writeFileSync(path.join(OUTPUT_DIR, filename), Buffer.from(buffer))
						console.log(`Downloaded ${filename}`)
					} else {
						console.error(`Failed to download ${media.ext} for topic ${topic}`)
					}
				})()
			)
		}
	}

	await Promise.all(promises)
}

async function main() {
	console.log("Starting seed data generation...")
	await ensureDir()

	const concurrency = 2
	const promises: Promise<void>[] = []
	console.log("Generating TXT files...")
	await generateTxt(concurrency)

	// console.log("Generating CSV files...")
	// await generateCsv()
	console.log("Generating PDF files...")
	await generatePdf(concurrency)

	console.log("Generating DOCX files...")
	await generateDocx(concurrency)

	console.log("Generating XLSX files...")
	await generateXlsx(concurrency)

	console.log("Generating PPTX files...")
	await generatePptx(concurrency)

	// console.log("Downloading media files (Images, Video, Audio)...")
	// promises.push(downloadMedia())

	console.log("Seed data generation complete!")
}

main().catch(console.error)
