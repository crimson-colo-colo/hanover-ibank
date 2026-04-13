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
	const content = faker.company.catchPhrase().replace(/\s+/g, "_").replace(/\//g, "-")
	return `${content}.${ext}`
}

async function generateTxt() {
	for (let i = 0; i < COUNT_PER_TYPE; i++) {
		const topic = getRandomTopic()
		const filename = getFilename(topic, "txt")
		const content = `${topic}\n\n${faker.lorem.paragraphs(5)}`
		fs.writeFileSync(path.join(OUTPUT_DIR, filename), content)
	}
}

async function generateCsv() {
	for (let i = 0; i < COUNT_PER_TYPE; i++) {
		const topic = getRandomTopic()
		const filename = getFilename(topic, "csv")
		let content = "ID,Category,Description,Amount,Status\n"
		for (let j = 0; j < 10; j++) {
			content += `${j},${topic},${faker.commerce.productName()},${faker.commerce.price()},${faker.helpers.arrayElement(["Pending", "Approved", "Denied"])}\n`
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
		doc.fontSize(24).text(topic, { align: "center" })
		doc.moveDown()
		doc.fontSize(12).text(faker.lorem.paragraphs(8))
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
				text: faker.lorem.paragraphs(5),
			}),
		]
		for (let i = 0; i < 15; i++) {
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
		const sheet = workbook.addWorksheet(topic.slice(0, 31))
		sheet.columns = [
			{ header: "Date", key: "date" },
			{ header: "Event", key: "event" },
			{ header: "User", key: "user" },
			{ header: "Action", key: "action" },
		]
		for (let j = 0; j < 50; j++) {
			sheet.addRow({
				date: faker.date.recent(),
				event: faker.hacker.phrase(),
				user: faker.person.fullName(),
				action: faker.hacker.verb(),
			})
		}
		await workbook.xlsx.writeFile(path.join(OUTPUT_DIR, filename))
	}
}

async function generatePptx() {
	for (let i = 0; i < COUNT_PER_TYPE; i++) {
		const topic = faker.company.name()
		const filename = getFilename(topic, "pptx")
		const pres = new PptxGenJS()
		const slide = pres.addSlide()
		slide.addText(topic, { x: 1, y: 1, fontSize: 36, color: "363636" })
		slide.addText(faker.lorem.paragraph(), { x: 1, y: 2, fontSize: 18 })
		for (let j = 0; j < 5; j++) {
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
		{ ext: "jpg", url: "https://picsum.photos/1200/800" },
		{
			ext: "mp4",
			url: "https://www.w3schools.com/html/mov_bbb.mp4",
		},
		{ ext: "mp3", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
	]

	for (const media of mediaTypes) {
		for (let i = 0; i < COUNT_PER_TYPE; i++) {
			const topic = getRandomTopic()
			const filename = getFilename(topic, media.ext)
			const response = await fetch(media.url)
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
