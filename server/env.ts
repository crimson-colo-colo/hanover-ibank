import { createEnv } from "@t3-oss/env-core"
import z from "zod"

export const env = createEnv({
	server: {
		PORT: z.coerce.number().default(3000),
		APP_URL: z.url().optional(),
		DATABASE_URL: z.string(),
		NODE_ENV: z.enum(["development", "production"]).default("development"),
	},
	runtimeEnv: process.env,
})

export const isDevelopment = env.NODE_ENV === "development"
