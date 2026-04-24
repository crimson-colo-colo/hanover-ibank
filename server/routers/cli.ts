import type { PushMessage } from "@shared/types.ts"
import webpush from "web-push"
import z from "zod"
import { db } from "../database.ts"
import { env } from "../env.ts"
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
			const subscriptions = await db.pushSubscription.findMany({
				where: {
					employeeId: opts.input.userId,
				},
			})

			if (subscriptions.length === 0) {
				throw new Error("No push subscriptions found for this user")
			}

			for (const subscription of subscriptions) {
				webpush.setVapidDetails(
					`mailto:${env.VAPID_CONTACT_EMAIL}`,
					env.VITE_VAPID_PUBLIC_KEY,
					env.VAPID_PRIVATE_KEY
				)

				const notification: z.infer<typeof PushMessage> = {
					title: "Test Notification",
					body: "This is a test notification sent from the server.",
					icon: "http://localhost:3000/favicon.png",
					tag: "abcdefghijklmnopqrstuvwxyz",
					url: "http://localhost:3000/dashboard",
				}

				await webpush.sendNotification(
					{
						endpoint: subscription.endpoint,
						keys: { p256dh: subscription.p256dh, auth: subscription.auth },
					},
					JSON.stringify(notification)
				)
			}
		}),
})
