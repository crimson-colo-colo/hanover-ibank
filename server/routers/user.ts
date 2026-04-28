import { PushSubscription } from "@shared/types.ts"
import sharp from "sharp"
import z from "zod"
import { auth0Management } from "../auth.ts"
import { db } from "../database.ts"
import { generateDefaultAvatar } from "../lib/avatar.ts"
import { sendPushNotification } from "../lib/notifications.tsx"
import { bucketName, s3 } from "../s3.ts"
import { authProcedure, router } from "../trpc.ts"

export const userRouter = router({
	getProfile: authProcedure.query(async (opts) => {
		const user = await db.employee.findUnique({
			where: {
				id: opts.ctx.auth.sub,
			},
			select: {
				role: true,
				emailNotifications: true,
				pushNotifications: true,
			},
		})
		const auth0User = await auth0Management.users.get(opts.ctx.auth.sub)
		return {
			id: opts.ctx.auth.sub,
			name: auth0User.name ?? auth0User.nickname ?? auth0User.username!,
			email: auth0User.email!,
			username: auth0User.username!,
			role: user!.role,
			emailNotifications: user!.emailNotifications,
			pushNotifications: user!.pushNotifications,
		}
	}),
	updateProfile: authProcedure
		.input(
			z.object({
				name: z.string().min(3).max(100),
				email: z.email(),
				username: z.string().min(3).max(100),
				emailNotifications: z.boolean(),
				pushNotifications: z.boolean(),
			})
		)
		.mutation(async (opts) => {
			try {
				await db.employee.update({
					where: {
						id: opts.ctx.auth.sub,
					},
					data: {
						emailNotifications: opts.input.emailNotifications,
						pushNotifications: opts.input.pushNotifications,
					},
				})
				await auth0Management.users.update(opts.ctx.auth.sub, {
					name: opts.input.name,
					email: opts.input.email,
				})
				await auth0Management.users.update(opts.ctx.auth.sub, {
					username: opts.input.username,
				})

				const avatar = await s3.headObject({
					Bucket: bucketName,
					Key: `avatar/${opts.ctx.auth.sub}.png`,
				})
				if (avatar.Metadata?.source !== "user") {
					const avatar = generateDefaultAvatar(opts.input.name)
					await s3.putObject({
						Bucket: bucketName,
						Key: `avatar/${opts.ctx.auth.sub}.png`,
						Body: avatar,
					})
				}

				return { error: null }
			} catch (err) {
				console.log(err)
				return { error: "Failed to update user profile information (duplicate email or username)." }
			}
		}),
	uploadAvatar: authProcedure
		.input(
			z.object({
				file: z.base64().max(10_000_000 * 1.3),
			})
		)
		.mutation(async (opts) => {
			const img = sharp(Buffer.from(opts.input.file, "base64")).resize({
				width: 300,
				height: 300,
				withoutEnlargement: true,
			})

			const buffer = await img.png().toBuffer()
			await s3.putObject({
				Bucket: bucketName,
				Key: `avatar/${opts.ctx.auth.sub}.png`,
				Body: buffer,
				Metadata: {
					source: "user",
				},
			})
		}),
	getAvatarUrl: authProcedure.input(z.object({ userId: z.string() })).query(async (opts) => {
		let object: { ETag?: string }
		try {
			object = await s3.headObject({
				Bucket: bucketName,
				Key: `avatar/${opts.input.userId}.png`,
			})
		} catch {
			const avatar = generateDefaultAvatar(opts.input.userId)
			object = await s3.putObject({
				Bucket: bucketName,
				Key: `avatar/${opts.input.userId}.png`,
				Body: avatar,
			})
		}
		return `/avatar/${opts.input.userId}?${(object.ETag ?? Date.now().toString()).replace(/"/g, "")}`
	}),
	createPushSubscription: authProcedure.input(PushSubscription).mutation(async (opts) => {
		await db.pushSubscription.upsert({
			where: {
				endpoint: opts.input.endpoint,
			},
			update: {
				endpoint: opts.input.endpoint,
				p256dh: opts.input.keys.p256dh,
				auth: opts.input.keys.auth,
				employeeId: opts.ctx.auth.sub,
			},
			create: {
				endpoint: opts.input.endpoint,
				p256dh: opts.input.keys.p256dh,
				auth: opts.input.keys.auth,
				employeeId: opts.ctx.auth.sub,
			},
		})
	}),
	deletePushSubscription: authProcedure
		.input(z.object({ endpoint: z.string() }))
		.mutation(async (opts) => {
			await db.pushSubscription.delete({
				where: {
					endpoint: opts.input.endpoint,
				},
			})
		}),
	sendTestPush: authProcedure.mutation(async (opts) => {
		await sendPushNotification(opts.ctx.auth.sub, {
			title: "Test Notification",
			body: "This is a test notification sent from the server.",
			icon: "http://localhost:3000/favicon.png",
			tag: "abcdefghijklmnopqrstuvwxyz",
			url: "http://localhost:3000/dashboard",
		})
	}),
})
