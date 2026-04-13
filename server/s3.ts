import { S3 } from "@aws-sdk/client-s3"
import { env } from "./env.ts"

export const s3 = new S3({
	endpoint: env.AWS_ENDPOINT_URL,
	region: env.AWS_DEFAULT_REGION,
	forcePathStyle: true,
	credentials: {
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	},
})

export const bucketName = env.AWS_S3_BUCKET_NAME

async function createBucketIfNotExists() {
	try {
		await s3.headBucket({ Bucket: bucketName })
	} catch {
		await s3.createBucket({ Bucket: bucketName })
		await s3.waitUntilBucketExists({ Bucket: bucketName }, { maxWaitTime: 10 })
	}
}
await createBucketIfNotExists()
