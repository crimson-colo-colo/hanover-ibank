import { PushMessage, type ServiceWorkerMessage } from "@shared/types.ts"
import * as idb from "idb-keyval"

declare const self: ServiceWorkerGlobalScope

self.addEventListener("install", (event) => {
	console.log("[sw] Service worker installed")
	self.skipWaiting()
})

self.addEventListener("activate", (event) => {
	console.log("[sw] Service worker activated")
})

self.addEventListener("push", (event) => {
	console.log("[sw] Push event received")
	const message = PushMessage.parse(event.data?.json())

	if (message.url) {
		event.waitUntil(idb.set(`push_${message.tag}`, message.url))
	}

	event.waitUntil(
		self.registration.showNotification(message.title, {
			body: message.body,
			icon: message.icon,
			tag: message.tag,
		})
	)

	postMessage({
		type: "new_notification",
	} satisfies ServiceWorkerMessage)
})

self.addEventListener("notificationclick", (event) => {
	console.log("[sw] Notification click event received")
	event.notification.close()
	if (!event.notification.tag) {
		return
	}

	event.waitUntil(
		(async () => {
			const url = (await idb.get<string>(`push_${event.notification.tag}`)) ?? "/"

			const windows = await self.clients.matchAll({
				type: "window",
			})
			await idb.del(`push_${event.notification.tag}`)
			for (const window of windows) {
				if ("focus" in window) {
					await window.focus()
					await window.navigate(url)
					return
				}
			}

			await self.clients.openWindow(url)
		})()
	)
})

self.addEventListener("notificationclose", (event) => {
	console.log("[sw] Notification close event received")
	if (event.notification.tag) {
		event.waitUntil(idb.del(`push_${event.notification.tag}`))
	}
})
