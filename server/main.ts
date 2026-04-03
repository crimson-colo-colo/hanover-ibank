import path from "node:path"
import { fileURLToPath } from "node:url"
import { createExpressMiddleware } from "@trpc/server/adapters/express"
import express from "express"
import { env } from "./env.ts"
import { appRouter } from "./router.ts"
import { contentDownloadRouter } from "./routers/download.ts"
import { createContext } from "./trpc.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const staticDir = path.join(__dirname, "../dist")

const app = express()

app.use(contentDownloadRouter)

app.use(
	"/trpc",
	createExpressMiddleware({
		router: appRouter,
		createContext,
	})
)

// serve vite build
app.use(express.static(staticDir))
// serve SPA fallback
app.get("*any", (req, res) => {
	res.sendFile(path.join(staticDir, "index.html"))
})

app.listen(env.PORT, () => {
	console.log(`[prod] ready on ${env.APP_URL}`)
})
