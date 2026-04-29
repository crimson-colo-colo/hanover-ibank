import { createEnv } from "@t3-oss/env-core"
import z from "zod"

export const env = createEnv({
	client: {
		VITE_AUTH0_DOMAIN: z.string(),
		VITE_AUTH0_CLIENT_ID: z.string(),
		VITE_AUTH0_AUDIENCE: z.string(),
		VITE_VAPID_PUBLIC_KEY: z.string(),
	},
	clientPrefix: "VITE_",
	runtimeEnv: import.meta.env,
})

export const isDevelopment = import.meta.env.DEV
