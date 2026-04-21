import { defineConfig, env } from "prisma/config"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.development.local" })
dotenv.config({ path: ".env.development" })

export default defineConfig({
	schema: "./prisma/schema.prisma",
	migrations: {
		path: "./prisma/migrations",
		seed: "tsx prisma/seed.ts",
	},
	datasource: {
		url: env("DATABASE_URL"),
	},
})
