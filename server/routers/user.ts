import sharp from "sharp"
import z from "zod"
import { auth0Management } from "../auth.ts"
import { db } from "../database.ts"
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
			role: userRole?.role,
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
			})
		}),
})
