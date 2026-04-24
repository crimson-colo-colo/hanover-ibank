import { createExpressMiddleware } from "@trpc/server/adapters/express"
import express from "express"
import morgan from "morgan"
import { createServer } from "vite"
import { env } from "./env.ts"
import { appRouter } from "./router.ts"
import { avatarRouter } from "./routers/avatar.ts"
import { contentDownloadRouter } from "./routers/download.ts"
import { createContext } from "./trpc.ts"

declare module "http" {
	interface IncomingMessage {
		vite?: boolean
		trpc?: boolean
	}
	interface ServerResponse {
		vite?: boolean
		trpc?: boolean
	}
}

const app = express()

// log api requests
app.use(
	morgan("dev", {
		skip: (req, res) => {
			if (req.vite || res.vite || req.trpc || res.trpc || req.path.startsWith("/avatar/")) {
				return true
			}
			return false
		},
	})
)

app.use(contentDownloadRouter)
app.use(avatarRouter)

app.use(
	"/trpc",
	(req, res, next) => {
		req.trpc = true
		res.trpc = true
		next()
	},
	createExpressMiddleware({
		router: appRouter,
		createContext,
	})
)

// create vite dev server
const vite = await createServer()
app.use((req, res, next) => {
	// mark request and response as vite
	req.vite = true
	res.vite = true
	next()
}, vite.middlewares)

app.listen(env.PORT, () => {
	console.log(`[dev] ready on ${env.APP_URL || `http://localhost:${env.PORT}`}`)
})

if (env.CLI_TOKEN) {
	console.warn("[cli] CLI_TOKEN is set, CLI access is enabled")
}
