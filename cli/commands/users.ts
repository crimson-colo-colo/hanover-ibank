import { Command } from "clipanion"
import { trpc } from "../trpc.ts"

export class UsersCommand extends Command {
	static override paths = [["users"]]

	async execute() {
		const users = await trpc.cli.getUsers.query()
		console.table(users)
	}
}
