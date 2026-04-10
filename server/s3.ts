import { S3 } from "@aws-sdk/client-s3"
import { env } from "./env.ts"

export const s3 = new S3({
	endpoint: env.S3_ENDPOINT,
	region: env.S3_REGION,
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY,
		secretAccessKey: env.S3_SECRET_KEY,
	},
})

export const bucketName = env.S3_BUCKET

async function createBucketIfNotExists() {
	try {
		await s3.headBucket({ Bucket: bucketName })
	} catch {
		await s3.createBucket({ Bucket: bucketName })
		await s3.waitUntilBucketExists({ Bucket: bucketName }, { maxWaitTime: 10 })
	}
}
await createBucketIfNotExists()
