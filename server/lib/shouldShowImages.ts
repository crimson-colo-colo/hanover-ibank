import { z } from "zod"
import { openrouter } from "./openrouter.ts"

/**
 * Classify a query using an llm to see if the user should see images in this request.
 * @param query
 */
export async function shouldShowImages(query: string) {
	const classificationPrompt = `You classify search queries by how much the user wants image results.

The user is searching a knowledge base of documents, files, images, videos, and URLs.

Respond with exactly one word:
- NONE — the user clearly wants text, facts, or written content
- MAYBE — the user could want some images mixed in, or it is unclear
- YES — the user clearly wants visual content

When in doubt, respond MAYBE.

Examples:
Query: how do I reset my password
NONE

Query: what is the refund policy
NONE

Query: show me the office floor plan
YES

Query: photos from the team retreat
YES

Query: quarterly report
NONE

Query: logo designs
YES

Query: onboarding process
MAYBE

Query: marketing materials
MAYBE

Query: contract for project X
NONE

Query: what does the new dashboard look like
YES`
	try {
		const response = await openrouter.chat.send({
			chatRequest: {
				models: [
					"mistralai/ministral-3b-2512",
					"mistralai/mixtral-8x7b-instruct",
					"google/gemma-3-4b-it",
				],
				provider: { requireParameters: true, preferredMaxLatency: 0.5 },
				temperature: 0,
				messages: [
					{
						role: "system",
						content: classificationPrompt,
					},
					{
						role: "user",
						content: `${query}`,
					},
				],
				stop: ["NONE", "MAYBE", "YES"],
				maxTokens: 5,
			},
		})
		const rawModelText = z.string().parse(response.choices[0].message.content)
		const cleanedModelText = rawModelText.toUpperCase().trim()
		return z.enum(["NONE", "MAYBE", "YES"]).parse(cleanedModelText)
	} catch (e) {
		return "MAYBE"
	}
}
