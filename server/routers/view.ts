import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { TRPCError } from "@trpc/server"
import z from "zod"
import { db } from "../database.ts"
import { bucketName, s3 } from "../s3.ts"
import { authProcedure, router } from "../trpc.ts"

export const viewRouter = router({
	view: authProcedure.input(z.object({ id: z.string() })).query(async (opts) => {
		const content = await db.content.findUnique({
			where: { id: opts.input.id },
		})
		if (!content) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Content not found",
			})
		}

		if (content.type === "Link") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Content is a link",
				cause: content.url,
			})
		}

		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: content.objectId!,
		})

		const url = await getSignedUrl(s3, command, { expiresIn: 300 })
		return { url }
	}),
})
