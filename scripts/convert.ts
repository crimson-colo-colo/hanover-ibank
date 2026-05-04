// curl https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/tomarkdown \

import fs from "node:fs/promises"
import path from "node:path"

const accountId = process.env.WORKERS_AI_ACCOUNT_ID
const apiKey = process.env.WORKERS_AI_API_KEY

if (!accountId || !apiKey) {
	console.error("Missing WORKERS_AI_ACCOUNT_ID or WORKERS_AI_API_KEY in environment variables")
	process.exit(1)
}

async function convertToMarkdown(filePath: string) {
	const formData = new FormData()
	formData.append("files", new Blob([await fs.readFile(filePath)]), path.basename(filePath))

	const res = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/tomarkdown`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
			body: formData,
		}
	)

	if (!res.ok) {
		console.error(`Failed to convert ${filePath}: ${res.status} ${res.statusText}`)
		return
	}

	const data = (await res.json()) as {
		result: {
			data: string
		}[]
	}
	console.log("```json")
	console.log(JSON.stringify(data, null, 2))
	console.log("```")

	const markdownContent = data.result[0].data
	console.log("```md")
	console.log(markdownContent.trim().replace(/\n\n+/g, "\n\n"))
	console.log("```")
}

async function main() {
	const files = process.argv.slice(2)
	if (files.length === 0) {
		console.error("Please provide at least one file to convert")
		process.exit(1)
	}

	for (const file of files) {
		await convertToMarkdown(file)
	}
}

main().catch((err) => {
	console.error("An error occurred:", err)
	process.exit(1)
})
