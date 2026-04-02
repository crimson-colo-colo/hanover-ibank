import { PrismaPg } from "@prisma/adapter-pg"
import { env } from "./env.ts"
import { PrismaClient } from "./generated/prisma/client.ts"
import { logger } from "./logger.ts"

export const db = new PrismaClient({
	adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
	errorFormat: env.NODE_ENV === "development" ? "pretty" : "minimal",
	log: [
		{ emit: "event", level: "query" },
		{ emit: "event", level: "error" },
		{ emit: "event", level: "warn" },
		{ emit: "event", level: "info" },
	],
})

db.$on("query", (e) => {
	if (env.NODE_ENV !== "development") return
	logger.debug(
		"[db] %s %s - %dms",
		e.query.replaceAll('"public".', "").replaceAll('"', "").slice(0, 100),
		e.params.length > 1000 ? `[${JSON.parse(e.params).length} params]` : e.params,
		Math.round(e.duration)
	)
})
db.$on("error", (e) => {
	logger.error("[db] %s", e.message)
})
db.$on("warn", (e) => {
	logger.warn("[db] %s", e.message)
})
db.$on("info", (e) => {
	logger.info("[db] %s", e.message)
})

db.$connect().then(() => {
	db.$executeRaw`SET default_text_search_config = 'pg_catalog.english'`
})
