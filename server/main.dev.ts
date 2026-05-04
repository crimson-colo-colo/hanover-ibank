import { readFile } from "node:fs/promises"
import https from "node:https"
import { createExpressMiddleware } from "@trpc/server/adapters/express"
import express from "express"
import morgan from "morgan"
import { createServer } from "vite"
import { env } from "./env.ts"
import { appRouter } from "./router.ts"
import { avatarRouter } from "./routers/avatar.ts"
import { contentDownloadRouter } from "./routers/download.ts"
import { webdavMiddleware } from "./routers/webdav.ts"
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
app.use(webdavMiddleware)

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

if (env.HTTPS_KEY_PATH && env.HTTPS_CERT_PATH) {
	const server = https.createServer({
		key: await readFile(env.HTTPS_KEY_PATH),
		cert: await readFile(env.HTTPS_CERT_PATH),
	})
	server.on("request", app).listen(env.HTTPS_PORT, () => {
		console.log(`[dev] https ready at https://localhost:${env.HTTPS_PORT}`)
	})
}

if (env.CLI_TOKEN) {
	console.warn("[environ] CLI access is enabled")
}

if (env.EMAIL_GATEWAY && env.EMAIL_CLIENT_ID && env.EMAIL_CLIENT_SECRET) {
	console.warn("[environ] email sending is enabled")
} else {
	console.warn("[environ] email sending is disabled, missing configuration")
}
