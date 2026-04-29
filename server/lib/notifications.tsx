import assert from "node:assert"
import type { PushMessage } from "@shared/types.ts"
import { render, toPlainText } from "react-email"
import webpush from "web-push"
import type z from "zod"
import { db } from "../database.ts"
import type { EmailConfig } from "../emails/Email.tsx"
import { env } from "../env.ts"
import { logger } from "../logger.ts"
import { auth0Cache } from "./auth0.ts"

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

			logger.error({ error, employeeId }, `Failed to send push notification`)
		}
	}
}

interface SendEmailRequest {
	to: string
	subject: string
	htmlBody: string
	textBody: string
}

type SendEmailResponse = { ok: true } | { ok: false; error: string }

export async function sendEmailNotification<Props extends { config: EmailConfig }>(
	employeeId: string,
	options: {
		subject: string
		template: React.ComponentType<Props>
		props: Omit<Props, "config">
	}
): Promise<{ ok: true } | { ok: false; error: string }> {
	if (!env.EMAIL_GATEWAY || !env.EMAIL_CLIENT_ID || !env.EMAIL_CLIENT_SECRET) {
		logger.warn(
			`Email gateway not configured, skipping email notification for employee ${employeeId}`
		)
		return { ok: false, error: "Email gateway not configured" }
	}

	const toAddress = await auth0Cache.getUser(employeeId).then((user) => user?.email)
	assert(toAddress, "Auth0 users must have an email address")

	const emailProps = {
		config: {
			assetOrigin: env.APP_URL,
			profileUrl: `${env.APP_URL}/profile`,
			supportUrl: `${env.APP_URL}/support`,
		},
		...options.props,
	} as Props

	const html = await render(<options.template {...emailProps} />)
	const text = toPlainText(html)

	const req: SendEmailRequest = {
		to: toAddress,
		subject: options.subject,
		htmlBody: html,
		textBody: text,
	}

	const res = await fetch(env.EMAIL_GATEWAY, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"CF-Access-Client-Id": env.EMAIL_CLIENT_ID,
			"CF-Access-Client-Secret": env.EMAIL_CLIENT_SECRET,
		},
		body: JSON.stringify(req),
	})

	if (res.status === 502) {
		logger.error(
			{ employeeId, toAddress },
			`Failed to send email notification: email gateway unavailable (502 Bad Gateway)`
		)
		return { ok: false, error: "Email gateway is currently unavailable" }
	}

	const responseBody = await res.clone().text()

	try {
		const data = (await res.json()) as SendEmailResponse
		if (!data.ok) {
			logger.error(
				{ employeeId, toAddress, error: data.error },
				`Failed to send email notification: gateway error`
			)
			return { ok: false, error: data.error }
		}
		return { ok: true }
	} catch (error) {
		if (error instanceof SyntaxError) {
			logger.error(
				{ error: String(error), employeeId, toAddress, statusCode: res.status, responseBody },
				`Failed to send email notification: invalid JSON response from gateway`
			)
			return { ok: false, error: "Failed to parse email gateway response" }
		}
		logger.error(
			{ error: String(error), employeeId, toAddress, statusCode: res.status, responseBody },
			"Failed to send email notification: unknown error"
		)
		return { ok: false, error: "Unknown error" }
	}
}
