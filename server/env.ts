import { createEnv } from "@t3-oss/env-core"
import z from "zod"

export const env = createEnv({
	server: {
		PORT: z.coerce.number().default(3000),
		APP_URL: z.url().optional(),
		APP_SECRET: z.string().min(32),
		DATABASE_URL: z.string(),
		NODE_ENV: z.enum(["development", "production"]).default("development"),
		AWS_ENDPOINT_URL: z.string(),
		AWS_DEFAULT_REGION: z.string(),
		AWS_ACCESS_KEY_ID: z.string(),
		AWS_SECRET_ACCESS_KEY: z.string(),
		AWS_S3_BUCKET_NAME: z.string(),
		VITE_AUTH0_DOMAIN: z.string(),
		VITE_AUTH0_CLIENT_ID: z.string(),
		VITE_AUTH0_AUDIENCE: z.string(),
		AUTH0_CLIENT_SECRET: z.string(),
		AUTH0_TENANT: z.string(),
		AUTH0_MANAGEMENT_CLIENT_ID: z.string(),
		AUTH0_MANAGEMENT_CLIENT_SECRET: z.string(),
		GOTENBERG_URL: z.url(),
	},
	runtimeEnv: process.env,
})

export const isDevelopment = env.NODE_ENV === "development"
