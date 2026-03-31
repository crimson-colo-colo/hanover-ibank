import { createExpressMiddleware } from "@trpc/server/adapters/express"
import express from "express"
import morgan from "morgan"
import { createServer } from "vite"
import { env } from "./env.ts"
import { appRouter } from "./router.ts"
import { createContext } from "./trpc.ts"

declare module "http" {
	interface IncomingMessage {
		vite?: boolean
	}
	interface ServerResponse {
		vite?: boolean
	}
}

const app = express()

// log api requests
app.use(morgan("dev", { skip: (req, res) => req.vite ?? res.vite ?? false }))

// create vite dev server
const vite = await createServer()
app.use((req, res, next) => {
	// mark request and response as vite
	req.vite = true
	res.vite = true
	next()
}, vite.middlewares)

app.use(
	"/trpc",
	createExpressMiddleware({
		router: appRouter,
		createContext,
	})
)

app.listen(env.PORT, () => {
	console.log(`[dev] ready on ${env.APP_URL || `http://localhost:${env.PORT}`}`)
})
