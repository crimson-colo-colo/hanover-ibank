// This script generates a variety of seed documents (TXT, CSV, PDF, DOCX, XLSX,
// PPTX) with random content using the Faker library. It also downloads sample
// media files (images, video, audio).

// This script was generated using an AI assistant with permission from the
// professor.

import fs from "node:fs"
import path from "node:path"
import { faker } from "@faker-js/faker"
import { Document, HeadingLevel, Packer, Paragraph } from "docx"
import ExcelJS from "exceljs"
import PDFDocument from "pdfkit"
import PptxGenJS from "pptxgenjs"

const OUTPUT_DIR = path.join(process.cwd(), "prisma", "seed-data", "generated")
const TOPICS = [
	"Claims Processing",
	"Underwriting Guidelines",
	"HR Policies",
	"Compliance and Regulatory Affairs",
	"Customer Service Procedures",
	"IT Support and Infrastructure",
	"Risk Management",
	"Marketing and Sales Strategy",
	"Financial Reporting",
	"Legal and General Counsel",
]

const COUNT_PER_TYPE = 5

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
	const safeTopic = topic.replace(/\s+/g, "_").replace(/\//g, "-")
	return `${safeTopic}_${docType}_${year}_${quarter}_v${version}.${ext}`
}

async function generateTxt() {
	for (let i = 0; i < COUNT_PER_TYPE; i++) {
		const topic = getRandomTopic()
		const filename = getFilename(topic, "txt")
		const content =
			`CONFIDENTIAL - INTERNAL USE ONLY\n\n` +
			`Subject: ${topic}\n` +
			`Date: ${faker.date.recent().toISOString().split("T")[0]}\n` +
			`Author: ${faker.person.fullName()} (${faker.person.jobTitle()})\n\n` +
			`Executive Summary:\n${faker.lorem.paragraph()}\n\n` +
			`Key Findings:\n` +
			`- ${faker.company.catchPhrase()}\n` +
			`- ${faker.company.buzzPhrase()}\n` +
			`- ${faker.hacker.phrase()}\n\n` +
			`Detailed Analysis:\n${faker.lorem.paragraphs(3, "\n\n")}\n\n` +
			`Conclusion:\n${faker.lorem.paragraph()}\n`
		fs.writeFileSync(path.join(OUTPUT_DIR, filename), content)
	}
}

async function generateCsv() {
	for (let i = 0; i < COUNT_PER_TYPE; i++) {
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

async function generatePdf() {
	for (let i = 0; i < COUNT_PER_TYPE; i++) {
		const topic = getRandomTopic()
		const filename = getFilename(topic, "pdf")
		const doc = new PDFDocument()
		doc.pipe(fs.createWriteStream(path.join(OUTPUT_DIR, filename)))

		// Title
		doc.fontSize(24).text(topic, { align: "center" })
		doc.moveDown()

		// Meta
		doc
			.fontSize(12)
			.fillColor("gray")
			.text(`Document ID: ${faker.string.uuid()}`, { align: "center" })
		doc.text(`Generated: ${faker.date.recent().toISOString().split("T")[0]}`, { align: "center" })
		doc.text(`Author: ${faker.person.fullName()}`, { align: "center" })
		doc.moveDown(2)

		// Content
		doc.fillColor("black").fontSize(14).text("Executive Summary", { underline: true })
		doc.moveDown(0.5)
		doc.fontSize(12).text(faker.lorem.paragraph())
		doc.moveDown()

		doc.fontSize(14).text("Key Findings", { underline: true })
		doc.moveDown(0.5)
		for (let k = 0; k < 4; k++) {
			doc.fontSize(12).text(`• ${faker.company.catchPhrase()}`)
		}

		const numPages = faker.number.int({ min: 3, max: 10 })
		for (let p = 2; p <= numPages; p++) {
			doc.addPage()
			doc.fontSize(18).text(`Section ${p - 1}: ${faker.company.catchPhrase()}`, { underline: true })
			doc.moveDown()
			doc.fontSize(12).text(faker.lorem.paragraphs(4))
			doc.moveDown(2)
			doc.fontSize(14).text("Key Metrics & Data Points", { underline: true })
			doc.moveDown(0.5)
			const numBullets = faker.number.int({ min: 3, max: 6 })
			for (let k = 0; k < numBullets; k++) {
				doc
					.fontSize(12)
					.text(`• ${toTitleCase(faker.company.buzzPhrase())}: $${faker.finance.amount()}`)
			}
		}

		doc.end()
	}
}

async function generateDocx() {
	for (let i = 0; i < COUNT_PER_TYPE; i++) {
		const topic = getRandomTopic()
		const filename = getFilename(topic, "docx")
		const content = [
			new Paragraph({
				text: topic,
				heading: HeadingLevel.HEADING_1,
			}),
			new Paragraph({
				text: `Author: ${faker.person.fullName()} | Date: ${faker.date.recent().toISOString().split("T")[0]}`,
				spacing: { after: 400 },
			}),
			new Paragraph({
				text: "Executive Summary",
				heading: HeadingLevel.HEADING_2,
			}),
			new Paragraph({
				text: faker.lorem.paragraph(),
			}),
		]
		const numSections = faker.number.int({ min: 3, max: 8 })
		for (let i = 0; i < numSections; i++) {
			content.push(
				new Paragraph({
					text: toTitleCase(faker.company.buzzPhrase()),
					heading: HeadingLevel.HEADING_2,
					spacing: {
						before: 400,
					},
				}),
				new Paragraph({
					text: faker.lorem.paragraphs(5),
				}),
				new Paragraph({
					text: toTitleCase(faker.company.buzzPhrase()),
					heading: HeadingLevel.HEADING_3,
					spacing: {
						before: 200,
					},
				}),
				new Paragraph({
					text: faker.lorem.paragraphs(2),
				}),
				new Paragraph({
					text: toTitleCase(faker.company.buzzPhrase()),
					heading: HeadingLevel.HEADING_3,
					spacing: {
						before: 200,
					},
				}),
				new Paragraph({
					text: faker.lorem.paragraphs(2),
				})
			)
		}
		const doc = new Document({
			sections: [
				{
					children: content,
				},
			],
		})
		const buffer = await Packer.toBuffer(doc)
		fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer)
	}
}

function toTitleCase(str: string) {
	return str
		.toLowerCase()
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")
}

async function generateXlsx() {
	for (let i = 0; i < COUNT_PER_TYPE; i++) {
		const topic = getRandomTopic()
		const filename = getFilename(topic, "xlsx")
		const workbook = new ExcelJS.Workbook()
		const cleanTopic = topic.slice(0, 31).replace(/[*?/\\[\]]/g, "")
		const sheet = workbook.addWorksheet(cleanTopic || "Data")
		sheet.columns = [
			{ header: "Transaction ID", key: "id", width: 40 },
			{ header: "Date", key: "date", width: 15 },
			{ header: "Department", key: "department", width: 25 },
			{ header: "Event/Category", key: "event", width: 30 },
			{ header: "User/Assignee", key: "user", width: 25 },
			{ header: "Action/Status", key: "action", width: 15 },
			{ header: "Amount", key: "amount", width: 15 },
		]
		const rowCount = faker.number.int({ min: 20, max: 200 })
		for (let j = 0; j < rowCount; j++) {
			sheet.addRow({
				id: faker.string.uuid(),
				date: faker.date.recent(),
				department: faker.commerce.department(),
				event: faker.hacker.phrase(),
				user: faker.person.fullName(),
				action: faker.helpers.arrayElement([
					"Created",
					"Updated",
					"Deleted",
					"Reviewed",
					"Approved",
				]),
				amount: parseFloat(faker.finance.amount()),
			})
		}
		sheet.getRow(1).font = { bold: true }
		await workbook.xlsx.writeFile(path.join(OUTPUT_DIR, filename))
	}
}

async function generatePptx() {
	for (let i = 0; i < COUNT_PER_TYPE; i++) {
		const topic = faker.company.name()
		const filename = getFilename(topic, "pptx")
		const pres = new PptxGenJS()
		const slide = pres.addSlide()
		slide.addText(topic, { x: 1, y: 1, fontSize: 36, color: "363636", bold: true })
		slide.addText(
			`Prepared by: ${faker.person.fullName()}\nDate: ${faker.date.recent().toISOString().split("T")[0]}`,
			{ x: 1, y: 2, fontSize: 18 }
		)
		const numSlides = faker.number.int({ min: 3, max: 7 })
		for (let j = 0; j < numSlides; j++) {
			const slide = pres.addSlide()
			slide.addText(toTitleCase(faker.company.buzzPhrase()), {
				x: 1,
				y: 1,
				fontSize: 36,
				color: "363636",
			})
			slide.addText(faker.lorem.paragraph(), { x: 1, y: 2, fontSize: 18 })
			const slide2 = pres.addSlide()
			slide2.addText(toTitleCase(faker.company.catchPhrase()), { x: 1, y: 0.5, fontSize: 24 })
			slide2.addText(
				`- ${faker.hacker.phrase()}\n- ${faker.hacker.phrase()}\n- ${faker.hacker.phrase()}`,
				{
					x: 1,
					y: 1.5,
					fontSize: 16,
				}
			)
		}
		await pres.writeFile({ fileName: path.join(OUTPUT_DIR, filename) })
	}
}

async function downloadMedia() {
	const mediaTypes = [
		{
			ext: "jpg",
			url: () => `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/1200/800`,
		},
		{
			ext: "mp4",
			url: () =>
				faker.helpers.arrayElement([
					"https://www.w3schools.com/html/mov_bbb.mp4",
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

	for (const media of mediaTypes) {
		for (let i = 0; i < COUNT_PER_TYPE; i++) {
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
		}
	}
}

async function main() {
	console.log("Starting seed data generation...")
	await ensureDir()

	console.log("Generating TXT files...")
	await generateTxt()

	console.log("Generating CSV files...")
	await generateCsv()

	console.log("Generating PDF files...")
	await generatePdf()

	console.log("Generating DOCX files...")
	await generateDocx()

	console.log("Generating XLSX files...")
	await generateXlsx()

	console.log("Generating PPTX files...")
	await generatePptx()

	console.log("Downloading media files (Images, Video, Audio)...")
	await downloadMedia()

	console.log("Seed data generation complete!")
}

main().catch(console.error)
