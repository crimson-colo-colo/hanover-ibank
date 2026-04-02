import { Command } from "clipanion"
import { trpc } from "../trpc.ts"

export class ContentCommand extends Command {
	static override paths = [["content"]]

	async execute() {
		const content = await trpc.cli.getContent.query()
		console.table(content)
	}
}
