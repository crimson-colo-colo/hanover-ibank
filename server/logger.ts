import pino from "pino"

const transport = process.stdout.isTTY ? { target: "pino-pretty" } : undefined

export const logger = pino({
	transport,
	level: process.env.NODE_ENV === "development" ? "debug" : "info",
})
