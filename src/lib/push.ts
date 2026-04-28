import { notifications } from "@mantine/notifications"
import { PushSubscription } from "@shared/types.ts"
import type z from "zod"
import { env } from "@/env.ts"
import { trpcClient } from "@/lib/trpc.ts"

export async function isPushAvailable() {
	if (!("serviceWorker" in navigator)) {
		return false
	}
	return Notification.permission !== "denied"
}

export async function subscribePush(): Promise<boolean> {
	if (!("serviceWorker" in navigator)) {
		notifications.show({
			title: "Error",
			message: "Push notifications are not supported in this browser.",
			color: "red",
		})
		return false
	}

	try {
		const sw = await navigator.serviceWorker.ready
		const subscription = await sw.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: env.VITE_VAPID_PUBLIC_KEY,
		})
		const sub = PushSubscription.parse(subscription.toJSON())
		await trpcClient.user.createPushSubscription.mutate(sub)
		notifications.show({
			title: "Subscribed",
			message: "You have successfully subscribed to push notifications.",
			color: "green",
		})
		return true
	} catch (err) {
		notifications.show({
			title: "Error",
			message: "Failed to subscribe to push notifications. See console for details.",
			color: "red",
		})
		console.error("Failed to subscribe to push notifications:", err)
		return false
	}
}

export async function getPushSubscription(): Promise<z.infer<typeof PushSubscription> | null> {
	if (!("serviceWorker" in navigator)) {
		return null
	}

	try {
		const sw = await navigator.serviceWorker.ready
		const subscription = await sw.pushManager.getSubscription()
		if (!subscription) {
			return null
		}
		await trpcClient.user.createPushSubscription.mutate(
			PushSubscription.parse(subscription.toJSON())
		)
		return PushSubscription.parse(subscription.toJSON())
	} catch (err) {
		console.error("Failed to get push subscription:", err)
		return null
	}
}

export async function unsubscribePush() {
	if (!("serviceWorker" in navigator)) {
		notifications.show({
			title: "Error",
			message: "Push notifications are not supported in this browser.",
			color: "red",
		})
		return
	}

	try {
		const sw = await navigator.serviceWorker.ready
		const subscription = await sw.pushManager.getSubscription()
		if (!subscription) {
			notifications.show({
				title: "Not Subscribed",
				message: "You are not currently subscribed to push notifications.",
				color: "yellow",
			})
			return
		}

		const success = await subscription.unsubscribe()
		if (!success) {
			throw new Error("unsubscribe returned false")
		}
		await trpcClient.user.deletePushSubscription.mutate({ endpoint: subscription.endpoint })

		notifications.show({
			title: "Unsubscribed",
			message: "You have successfully unsubscribed from push notifications.",
			color: "green",
		})
		return PushSubscription.parse(subscription.toJSON())
	} catch (err) {
		notifications.show({
			title: "Error",
			message: "Failed to unsubscribe from push notifications. See console for details.",
			color: "red",
		})
		console.error("Failed to unsubscribe from push notifications:", err)
	}
}
