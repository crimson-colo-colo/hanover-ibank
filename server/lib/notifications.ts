import type { PushMessage } from "@shared/types.ts"
import webpush from "web-push"
import type z from "zod"
import { db } from "../database.ts"
import { env } from "../env.ts"

export async function sendPushNotification(
	employeeId: string,
	notification: z.infer<typeof PushMessage>
) {
	const subscriptions = await db.pushSubscription.findMany({
		where: {
			employeeId,
		},
	})

	webpush.setVapidDetails(
		`mailto:${env.VAPID_CONTACT_EMAIL}`,
		env.VITE_VAPID_PUBLIC_KEY,
		env.VAPID_PRIVATE_KEY
	)
	for (const subscription of subscriptions) {
		try {
			await webpush.sendNotification(
				{
					endpoint: subscription.endpoint,
					keys: { p256dh: subscription.p256dh, auth: subscription.auth },
				},
				JSON.stringify(notification)
			)
		} catch (error) {
			if (error instanceof webpush.WebPushError) {
				if (error.statusCode === 410) {
					// Subscription is no longer valid, delete it from the database
					await db.pushSubscription.delete({
						where: {
							endpoint: subscription.endpoint,
						},
					})
					continue
				}
			}

			console.error(`Failed to send push notification:`, error)
		}
	}
}
