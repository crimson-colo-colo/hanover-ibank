import { Command } from "clipanion"

export default class InfoCommand extends Command {
	static override paths = [["info"], Command.Default]
	async execute() {
		console.log("this is the info command")
	}
}
