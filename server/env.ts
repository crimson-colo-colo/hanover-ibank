import { createEnv } from "@t3-oss/env-core"
import z from "zod"

export const env = createEnv({
	server: {
		PORT: z.coerce.number().default(3000),
		APP_URL: z.url().optional(),
		DATABASE_URL: z.string(),
		NODE_ENV: z.enum(["development", "production"]).default("development"),
		S3_ENDPOINT: z.string(),
		S3_PORT: z.coerce.number(),
		S3_SSL: z.enum(["true", "false"]).transform((val) => val === "true"),
		S3_ACCESS_KEY: z.string(),
		S3_SECRET_KEY: z.string(),
		S3_BUCKET: z.string(),
		VITE_AUTH0_DOMAIN: z.string(),
		VITE_AUTH0_CLIENT_ID: z.string(),
		VITE_AUTH0_AUDIENCE: z.string(),
		AUTH0_CLIENT_SECRET: z.string(),
		AUTH0_TENANT: z.string(),
		AUTH0_MANAGEMENT_CLIENT_ID: z.string(),
		AUTH0_MANAGEMENT_CLIENT_SECRET: z.string(),
	},
	runtimeEnv: process.env,
})

export const isDevelopment = env.NODE_ENV === "development"
