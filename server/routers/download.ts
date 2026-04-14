import assert from "node:assert"
import { Readable } from "node:stream"
import express, { type Request, type Response } from "express"
import * as jose from "jose"
import z from "zod"
import { db } from "../database.ts"
import { env } from "../env.ts"
import { bucketName, s3 } from "../s3.ts"
import {type FileType, fileTypeToMime} from "@shared/filetype.ts";

export const contentDownloadRouter = express.Router()

export type DownloadTokenPayload = z.infer<typeof DownloadTokenPayload>
export const DownloadTokenPayload = z.object({
	contentId: z.cuid2(),
})

contentDownloadRouter.get("/content/download", async (req: Request, res: Response) => {
	const query = z.object({ token: z.string(), download: z.boolean().optional() }).safeParse(req.query)
	if (!query.success) {
		return res.status(400).json({ error: "Token is required" })
	}

	const { token } = query.data
	let payload: DownloadTokenPayload
	try {
		const { payload: verifiedPayload } = await jose.jwtVerify(
			token,
			new TextEncoder().encode(env.APP_SECRET),
			{
				algorithms: ["HS256"],
			}
		)
		const parsedPayload = DownloadTokenPayload.safeParse(verifiedPayload)
		if (!parsedPayload.success) {
			throw new Error("Invalid token payload")
		}
		payload = parsedPayload.data
	} catch {
		return res.status(401).json({ error: "Invalid or expired token" })
	}

	const content = await db.content.findUnique({
		where: { id: payload.contentId },
	})
	if (!content) {
		return res.status(404).json({ error: "Content not found" })
	}

	if (content.type === "Link") {
		return res.redirect(content.url!)
	}

	const object = await s3.getObject({
		Bucket: bucketName,
		Key: content.objectId!,
	})
	const contentType = object.ContentType && object.ContentType !== "application/octet-stream"
		? object.ContentType
		: fileTypeToMime[object.Metadata?.filetype as FileType] ?? "application/octet-stream"
	res.setHeader("Content-Type", contentType)

	res.setHeader("Content-Disposition", `${query.data.download ?? false ? "attachment" : "inline"}; filename="${content.title}"`) // todo: make it both inline and attachment
	if (object.ContentType && object.Metadata && object.Metadata) res.setHeader("Content-Type", contentType)
	console.log(object)
	assert(object.Body, "S3 object body is undefined")
	assert(object.Body instanceof Readable, "S3 object body is not a stream.Readable")
	object.Body.pipe(res)
})
