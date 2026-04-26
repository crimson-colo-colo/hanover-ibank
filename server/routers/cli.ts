import z from "zod"
import { auth0Management } from "../auth.ts"
import { db } from "../database.ts"
import { TestEmail } from "../emails/TestEmail.tsx"
import { sendEmailNotification, sendPushNotification } from "../lib/notifications.tsx"
import { cliProcedure, router } from "../trpc.ts"

export type CliRouter = typeof cliRouter
export const cliRouter = router({
	getUsers: cliProcedure.query(async () => {
		const users = await db.employee.findMany()
		const auth0Users = await auth0Management.users.list()

		return users.map((user) => {
			const auth0User = auth0Users.data.find((u) => u.user_id === user.id)
			return {
				id: user.id,
				name: auth0User?.name ?? auth0User?.nickname ?? auth0User?.username ?? "Unknown",
				email: auth0User?.email ?? "Unknown",
				role: user.role,
			}
		})
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
	sendEmail: cliProcedure
		.input(
			z.object({
				userId: z.string().min(1),
			})
		)
		.mutation(async (opts) => {
			const userName = await auth0Management.users
				.get(opts.input.userId)
				.then((user) => user.name || user.username!)

			return await sendEmailNotification(opts.input.userId, {
				subject: "Test Email",
				template: TestEmail,
				props: {
					userId: opts.input.userId,
					userName,
				},
			})
		}),
})
