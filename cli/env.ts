import { createEnv } from "@t3-oss/env-core"
import z from "zod"

export const env = createEnv({
	server: {
		API_URL: z.string(),
		CLI_TOKEN: z.string(),
	},
	runtimeEnv: process.env,
})
