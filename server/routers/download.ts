import express, { type Request, type Response } from "express"
import { db } from "../database"
import { bucketName, s3 } from "../s3"

export const contentDownloadRouter = express.Router()

contentDownloadRouter.get(
	"/content/download/:id",
	async (req: Request<{ id: string }>, res: Response) => {
		const contentId = req.params.id
		if (!contentId) {
			return res.status(400).json({ error: "Content ID is required" })
		}

		const content = await db.content.findUnique({
			where: { id: contentId },
		})
		if (!content) {
			return res.redirect("/analyst")
		}

		if (content.type === "Link") {
			return res.redirect(content.url!)
		}

		const stream = await s3.getObject(bucketName, content.objectId!)
		res.setHeader("Content-Disposition", `attachment; filename="${content.title}"`)
		stream.pipe(res)
	}
)
