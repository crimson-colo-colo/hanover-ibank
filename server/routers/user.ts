import sharp from "sharp"
import z from "zod"
import { auth0Management } from "../auth.ts"
import { db } from "../database.ts"
import { generateDefaultAvatar } from "../lib/avatar.ts"
import { bucketName, s3 } from "../s3.ts"
import { authProcedure, router } from "../trpc.ts"

export const userRouter = router({
	getProfile: authProcedure.query(async (opts) => {
		const userRole = await db.employee.findUnique({
			where: {
				id: opts.ctx.auth.sub,
			},
			select: {
				role: true,
			},
		})
		const auth0User = await auth0Management.users.get(opts.ctx.auth.sub)
		return {
			id: opts.ctx.auth.sub,
			name: auth0User.name ?? auth0User.nickname ?? auth0User.username!,
			email: auth0User.email!,
			username: auth0User.username!,
			role: userRole!.role,
		}
	}),
	updateProfile: authProcedure
		.input(
			z.object({
				name: z.string().min(3).max(100),
				email: z.email(),
				username: z.string().min(3).max(100),
			})
		)
		.mutation(async (opts) => {
			try {
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

	getStats: authProcedure.query(async(opts) => {
		const userId = opts.ctx.auth.sub

		const [employee, contentItems] = await Promise.all([
			db.employee.findUniqueOrThrow({
				where: { id: userId },
				select: { createdAt: true },
			}),
			db.content.findMany({
				where: { ownerId: userId },
				select: { id: true, type: true, objectId: true }
			}),
		])

		const fileItems = contentItems.filter((c) => c.type === "Object" && c.objectId)
		const linkCount = contentItems.filter((c) => c.type === "Link").length

		const fileMetadata = await Promise.all(
			fileItems.map(async (item) => {
				try {
					const head = await s3.headObject({
						Bucket: bucketName,
						Key: item.objectId!,
					})
					return {
						size: head.ContentLength ?? 0,
						mimeType: head.ContentType ?? "application/octet-stream",
					}
				} catch {
					return null
				}
			})
		)
	})
})
