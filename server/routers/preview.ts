import { GetObjectCommand, type HeadObjectCommandOutput } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { FileType } from "@shared/filetype.ts"
import { TRPCError } from "@trpc/server"
import z from "zod"
import { db } from "../database.ts"
import { env } from "../env.ts"
import { bucketName, s3 } from "../s3.ts"
import { authProcedure, router } from "../trpc.ts"

export async function convertToPDF(key: string, filename: string) {
	const formData = new FormData()
	formData.append(
		"files",
		new Blob(
			[
				(await s3
					.getObject({ Bucket: bucketName, Key: key })
					.then((res) => res.Body!.transformToByteArray())) as Uint8Array<ArrayBuffer>,
			],
			{ type: "application/octet-stream" }
		),
		filename
	)
	return await fetch(`${env.GOTENBERG_URL}/forms/libreoffice/convert`, {
		method: "POST",
		body: formData,
	})
}

export const previewRouter = router({
	getContentUrl: authProcedure.input(z.object({ id: z.string() })).query(async (opts) => {
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

		await db.recentTimestamps.update({
			where: {
				employeeId_contentId: {
					contentId: opts.input.id,
					employeeId: opts.ctx.auth.sub,
				},
			},
			data: {
				recentlyViewed: new Date(),
			},
		})

		await db.recentTimestamps.update({
			where: {
				employeeId_contentId: {
					contentId: opts.input.id,
					employeeId: opts.ctx.auth.sub,
				},
			},
			data: {
				viewCount: {
					increment: 1,
				},
			},
		})

		const metadata = await s3.headObject({
			Bucket: bucketName,
			Key: content.objectId!,
		})

		const fileType = metadata.Metadata?.filetype ?? FileType.Unknown

		if (
			fileType === FileType.WordDocument ||
			fileType === FileType.Excel ||
			fileType === FileType.Powerpoint
		) {
			const previewKey = `preview/${content.objectId!}`

			let previewMetadata: HeadObjectCommandOutput | undefined
			try {
				previewMetadata = await s3.headObject({
					Bucket: bucketName,
					Key: previewKey,
				})
			} catch {}

			if (previewMetadata?.Metadata) {
				// ensure preview file is up to date
				if (previewMetadata.Metadata.original_etag === metadata.ETag) {
					const command = new GetObjectCommand({
						Bucket: bucketName,
						Key: previewKey,
					})
					const url = await getSignedUrl(s3, command, { expiresIn: 300 })
					return { url }
				}

				// otherwise, convert the file again
			}

			let res: Response
			try {
				res = await convertToPDF(content.objectId!, content.title)
			} catch (error) {
				console.log(error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to connect to document conversion service",
					cause: error instanceof Error ? error.message : String(error),
				})
			}
			if (!res.ok) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to convert document for preview",
				})
			}
			const pdfBlob = await res.blob()
			const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())
			await s3.putObject({
				Bucket: bucketName,
				Key: previewKey,
				Body: pdfBuffer,
				ContentType: "application/pdf",
				Metadata: {
					filetype: FileType.Pdf,
					original_filetype: fileType,
					original_etag: metadata.ETag!,
				},
			})
			const command = new GetObjectCommand({
				Bucket: bucketName,
				Key: previewKey,
			})
			const url = await getSignedUrl(s3, command, { expiresIn: 300 })
			return { url }
		}

		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: content.objectId!,
		})

		const url = await getSignedUrl(s3, command, { expiresIn: 300 })
		return { url }
	}),

	getPlaintextContent: authProcedure.input(z.object({ id: z.string() })).query(async (opts) => {
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
			})
		}

		const metadata = await s3.headObject({
			Bucket: bucketName,
			Key: content.objectId!,
		})

		const fileType = metadata.Metadata?.filetype ?? FileType.Unknown

		if (fileType !== FileType.Plaintext) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Content is not plaintext",
			})
		}

		const data = await s3.getObject({
			Bucket: bucketName,
			Key: content.objectId!,
		})

		await db.recentTimestamps.update({
			where: {
				employeeId_contentId: {
					contentId: opts.input.id,
					employeeId: opts.ctx.auth.sub,
				},
			},
			data: {
				recentlyViewed: new Date(),
				viewCount: {
					increment: 1,
				},
			},
		})
		const text = await data.Body!.transformToString()

		return { text }
	}),
})
