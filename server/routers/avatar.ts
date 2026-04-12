import assert from "node:assert"
import { Readable } from "node:stream"
import express, { type Request, type Response } from "express"
import { bucketName, s3 } from "../s3.ts"

export const avatarRouter = express.Router()

avatarRouter.get("/avatar/:userId", async (req: Request<{ userId: string }>, res: Response) => {
	const { userId } = req.params

	try {
		const object = await s3.getObject({
			Bucket: bucketName,
			Key: `avatar/${userId}.png`,
		})

		assert(object.Body, "S3 object body is undefined")
		assert(object.Body instanceof Readable, "S3 object body is not a stream.Readable")
		res.setHeader("Content-Type", "image/png")
		object.Body.pipe(res)
	} catch {
		res.status(404).end()
	}
})
