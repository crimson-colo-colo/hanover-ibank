import * as Minio from "minio"
import { env } from "./env.ts"
import { publicProcedure, router } from "./trpc.ts"

export const s3 = new Minio.Client({
	endPoint: env.S3_ENDPOINT,
	port: env.S3_PORT,
	useSSL: env.S3_SSL,
	accessKey: env.S3_ACCESS_KEY,
	secretKey: env.S3_SECRET_KEY,
})

export const bucketName = env.S3_BUCKET

if (!(await s3.bucketExists(bucketName))) {
	await s3.makeBucket(bucketName)
}

interface S3Object {
	key: string | undefined
	name: string | undefined
	size: number | undefined
}

export const storageRouter = router({
	listObjects: publicProcedure.query(async () => {
		const objects = await new Promise<S3Object[]>((resolve) => {
			const items: S3Object[] = []
			s3.listObjects(bucketName)
				.on("data", (obj) =>
					items.push({
						key: obj.key,
						name: obj.key,
						size: obj.size,
					})
				)
				.on("end", () => resolve(items))
		})
		return objects
	}),
})
