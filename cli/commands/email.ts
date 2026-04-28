import { Command, Option } from "clipanion"
import { trpc } from "../trpc.ts"

export class SendEmailCommand extends Command {
	static override paths = [["email", "send"]]

	userId = Option.String({ required: true })

	async execute() {
		try {
			const result = await trpc.cli.sendEmail.mutate({ userId: this.userId })
			if (!result.ok) {
				console.error("Failed to send email notification:", result.error)
				return
			}
			console.log("Email notification sent successfully")
		} catch (err) {
			console.error("Failed to send email notification:", err)
		}
	}
}
