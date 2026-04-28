import { Command, Option } from "clipanion"
import { trpc } from "../trpc.ts"

export class ListPushSubscriptionsCommand extends Command {
	static override paths = [["push", "list"]]

	async execute() {
		const subscriptions = await trpc.cli.listPushSubscriptions.query()
		for (const sub of subscriptions) {
			if (sub.endpoint.length > 50) {
				sub.endpoint = `${sub.endpoint.slice(0, 30)}...${sub.endpoint.slice(-20)}`
			}
			if (sub.p256dh.length > 16) {
				sub.p256dh = `${sub.p256dh.slice(0, 8)}...${sub.p256dh.slice(-8)}`
			}
		}
		console.table(subscriptions)
	}
}

export class SendPushCommand extends Command {
	static override paths = [["push", "send"]]

	userId = Option.String({ required: true })

	async execute() {
		try {
			await trpc.cli.sendPush.mutate({ userId: this.userId })
			console.log("Push notification sent successfully")
		} catch (err) {
			console.error("Failed to send push notification:", err)
		}
	}
}
