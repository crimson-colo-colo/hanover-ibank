import express, { type Request, type Response } from "express"
import * as jose from "jose"
import z from "zod"
import { db } from "../database.ts"
import { env } from "../env.ts"
import { bucketName, s3 } from "../s3.ts"

export const contentDownloadRouter = express.Router()

export type DownloadTokenPayload = z.infer<typeof DownloadTokenPayload>
export const DownloadTokenPayload = z.object({
	contentId: z.cuid2(),
})

contentDownloadRouter.get("/content/download", async (req: Request, res: Response) => {
	const query = z.object({ token: z.string() }).safeParse(req.query)
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

	const stream = await s3.getObject(bucketName, content.objectId!)
	res.setHeader("Content-Disposition", `attachment; filename="${content.title}"`)
	stream.pipe(res)
})
