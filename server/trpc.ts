import { UTCDate } from "@date-fns/utc"
import { Temporal } from "@js-temporal/polyfill"
import { initTRPC, TRPCError } from "@trpc/server"
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express"
import superjson from "superjson"
import { auth0Api, type JWTPayload } from "./auth.ts"
import { db } from "./database.ts"
import { EmployeeRole } from "./generated/prisma/client.ts"

interface TRPCContext {
	auth: JWTPayload | undefined
}

export async function createContext({
	req,
	res,
}: CreateExpressContextOptions): Promise<TRPCContext> {
	const authorization = req.headers.authorization?.trim()
	const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
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

export const authProcedure = publicProcedure.use(async (opts) => {
	const { ctx } = opts
	const auth = ctx.auth
	if (auth === undefined) {
		throw new TRPCError({ code: "UNAUTHORIZED" })
	}

	const userPromise = db.employee.findFirst({
		where: {
			id: auth.sub,
		},
	})
	const nowTruncated = Temporal.Now.instant().round({
		roundingMode: "floor",
		smallestUnit: "second",
	})
	const hour = nowTruncated.round({
		roundingMode: "floor",
		smallestUnit: "hour",
	})
	const day = nowTruncated.round({
		roundingMode: "floor",
		smallestUnit: "hour",
		roundingIncrement: 24,
	})

	if (!opts.path.includes("getAvatarUrl")) {
		// FIXME: fix this awful way to handle concurrent upserts
		try {
			await logActivity(auth, nowTruncated, opts, day, hour)
		} catch {
			await logActivity(auth, nowTruncated, opts, day, hour)
		}
	}

	return opts.next({
		ctx: {
			...ctx,
			auth: auth,
			user: await userPromise,
		},
	})
})

export const adminProcedure = authProcedure.use(async (opts) => {
	const { user } = opts.ctx

	if (user?.role !== EmployeeRole.Admin) {
		throw new TRPCError({ code: "UNAUTHORIZED" })
	}

	return opts.next({
		ctx: opts.ctx,
	})
})
async function logActivity(
	auth: JWTPayload,
	nowTruncated: Temporal.Instant,
	opts: { path: string },
	day: Temporal.Instant,
	hour: Temporal.Instant
) {
	await db.userActivity.upsert({
		where: {
			timestamp_employeeId_path: {
				employeeId: auth.sub,
				timestamp: new UTCDate(nowTruncated.epochMilliseconds).toISOString(),
				path: opts.path,
			},
		},
		create: {
			employee: {
				connect: {
					id: auth.sub,
				},
			},
			timestamp: new UTCDate(nowTruncated.epochMilliseconds).toISOString(),
			path: opts.path,
			day: new UTCDate(day.epochMilliseconds).toISOString(),
			hour: new UTCDate(hour.epochMilliseconds).toISOString(),
		},
		update: {
			count: { increment: 1 },
		},
	})
}
