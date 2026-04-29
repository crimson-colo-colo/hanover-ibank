import { FileType } from "@shared/filetype.ts"
import { ContentCheckedInEmail } from "../emails/ContentCheckedInEmail.tsx"
import { ContentTransferredEmail } from "../emails/ContentTransferredEmail.tsx"
import { ExpiringSoonEmail } from "../emails/ExpiringSoonEmail.tsx"
import { Assets, assetUrl } from "../emails/lib.ts"
import { env } from "../env.ts"
import {
	type Content,
	ContentType,
	type Employee,
	type Notification,
} from "../generated/prisma/client.ts"
import { auth0Cache } from "./auth0.ts"
import { sendEmailNotification, sendPushNotification } from "./notifications.tsx"

export async function notifyContentCheckedOut(
	notification: Notification,
	content: Content,
	actor: Employee
) {
	const actorInfo = await auth0Cache.getUser(actor.id)
	await sendPushNotification(notification.employeeId, {
		title: `iBank: ${content.title} checked out`,
		body: `${actorInfo?.name || "An employee"} checked out ${content.title}. It cannot be edited by others until it is checked back in.`,
		tag: notification.id,
		icon: `${env.APP_URL}/avatar/${actor.id}`,
		url: `${env.APP_URL}/preview/${content.id}`,
	})
}

export async function notifyContentCheckedIn(
	notification: Notification,
	content: Content,
	actor: Employee
) {
	const userInfo = await auth0Cache.getUser(notification.employeeId)
	const actorInfo = await auth0Cache.getUser(actor.id)
	await sendPushNotification(notification.employeeId, {
		title: `iBank: ${content.title} checked in`,
		body: `${actorInfo?.name || "An employee"} checked in ${content.title}. It is now available for others to edit.`,
		tag: notification.id,
		icon: `${env.APP_URL}/avatar/${actor.id}`,
		url: `${env.APP_URL}/preview/${content.id}`,
	})
	await sendEmailNotification(notification.employeeId, {
		subject: `${content.title} has been checked in`,
		template: ContentCheckedInEmail,
		props: {
			userName: userInfo?.name || "User",
			contentName: content.title,
			actorName: actorInfo?.name || "An employee",
			action: `${env.APP_URL}/preview/${content.id}`,
		},
	})
}

export async function notifyContentEdited(
	notification: Notification,
	content: Content,
	actor: Employee
) {
	const actorInfo = await auth0Cache.getUser(actor.id)
	await sendPushNotification(notification.employeeId, {
		title: `iBank: ${content.title} edited`,
		body: `${actorInfo?.name || "An employee"} edited ${content.title}. Click to review the latest version.`,
		tag: notification.id,
		icon: `${env.APP_URL}/avatar/${actor.id}`,
		url: `${env.APP_URL}/preview/${content.id}`,
	})
}

export async function notifyContentTransferred(
	notification: Notification,
	content: Content,
	actor: Employee
) {
	const userInfo = await auth0Cache.getUser(notification.employeeId)
	const actorInfo = await auth0Cache.getUser(actor.id)
	await sendPushNotification(notification.employeeId, {
		title: `iBank: ${content.title} transferred`,
		body: `${actorInfo?.name || "An employee"} transferred ownership of this content to you. Click to view it.`,
		tag: notification.id,
		icon: `${env.APP_URL}/avatar/${actor.id}`,
		url: `${env.APP_URL}/preview/${content.id}`,
	})
	await sendEmailNotification(notification.employeeId, {
		subject: `${content.title} has been transferred to you`,
		template: ContentTransferredEmail,
		props: {
			userName: userInfo?.name || "User",
			contentName: content.title,
			actorName: actorInfo?.name || "An employee",
			action: `${env.APP_URL}/preview/${content.id}`,
		},
	})
}

export async function notifyContentAdded(
	notification: Notification,
	content: Content,
	actor: Employee
) {
	const actorInfo = await auth0Cache.getUser(actor.id)
	await sendPushNotification(notification.employeeId, {
		title: `iBank: ${content.title} added`,
		body: `${actorInfo?.name || "An employee"} added new content for you. Click to view it.`,
		tag: notification.id,
		icon: `${env.APP_URL}/avatar/${actor.id}`,
		url: `${env.APP_URL}/preview/${content.id}`,
	})
}

export async function notifyExpiringOneDay(notification: Notification, content: Content) {
	const userInfo = await auth0Cache.getUser(notification.employeeId)
	await sendPushNotification(notification.employeeId, {
		title: `iBank: ${content.title} expires soon`,
		body: `${content.title} expires in one day. Review or update it to keep it up-to-date.`,
		tag: notification.id,
		icon: assetUrl(env.APP_URL, Assets.Logo),
		url: `${env.APP_URL}/preview/${content.id}`,
	})
	await sendEmailNotification(notification.employeeId, {
		subject: `${content.title} is expiring soon`,
		template: ExpiringSoonEmail,
		props: {
			userName: userInfo?.name || "User",
			contentName: content.title,
			fileType: content.type === ContentType.Link ? FileType.Link : FileType.Unknown, // TODO: determine file type
			action: `${env.APP_URL}/preview/${content.id}`,
			expires: "in 1 day",
		},
	})
}
