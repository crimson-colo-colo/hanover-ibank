import z from "zod"
import { db } from "../database.ts"
import { sendPushNotification } from "../lib/notifications.ts"
import { cliProcedure, router } from "../trpc.ts"

export type CliRouter = typeof cliRouter
export const cliRouter = router({
	getUsers: cliProcedure.query(async () => {
		const users = db.employee.findMany()
		return users
	}),
	getContent: cliProcedure.query(async () => {
		const content = db.content.findMany()
		return content
	}),
	listPushSubscriptions: cliProcedure.query(async () => {
		const subscriptions = db.pushSubscription.findMany()
		return subscriptions
	}),
	sendPush: cliProcedure
		.input(
			z.object({
				userId: z.string().min(1),
			})
		)
		.mutation(async (opts) => {
			const numSubscriptions = await db.pushSubscription.count({
				where: {
					employeeId: opts.input.userId,
				},
			})
			if (numSubscriptions === 0) {
				throw new Error("No push subscriptions found for this user")
			}

			await sendPushNotification(opts.input.userId, {
				title: "Test Notification",
				body: "This is a test notification sent from the server.",
				icon: "http://localhost:3000/favicon.png",
				tag: "abcdefghijklmnopqrstuvwxyz",
				url: "http://localhost:3000/dashboard",
			})
		}),
})
