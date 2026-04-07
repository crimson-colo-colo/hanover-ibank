import { initTRPC, TRPCError } from "@trpc/server"
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express"
import superjson from "superjson"
import { auth0Api, type JWTPayload } from "./auth.ts"

interface TRPCContext {
	auth: JWTPayload | undefined
}

export async function createContext({
	req,
	res,
}: CreateExpressContextOptions): Promise<TRPCContext> {
	console.log(req.auth)

	const accessToken = req.headers.authorization?.replace(/^Bearer /, "")
	if (!accessToken) {
		return {
			auth: undefined,
		}
	}

	let payload: Partial<JWTPayload>
	try {
		payload = await auth0Api.verifyAccessToken({
			accessToken,
		})
	} catch {
		return {
			auth: undefined,
		}
	}

	const sub = payload.sub
	if (!sub) {
		throw new TRPCError({ code: "BAD_REQUEST" })
	}

	return {
		auth: { sub: sub },
	}
}

type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({
	transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure

export const authProcedure = publicProcedure.use((opts) => {
	const { ctx } = opts
	const auth = ctx.auth
	if (auth === undefined) {
		throw new TRPCError({ code: "UNAUTHORIZED" })
	} else
		return opts.next({
			ctx: {
				...ctx,
				auth: auth,
			},
		})
})
