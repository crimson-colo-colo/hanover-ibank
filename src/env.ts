import { createEnv } from "@t3-oss/env-core"
import z from "zod"

export const env = createEnv({
	client: {},
	clientPrefix: "VITE_",
	runtimeEnv: import.meta.env,
})

export const isDevelopment = import.meta.env.NODE_ENV === "development"
