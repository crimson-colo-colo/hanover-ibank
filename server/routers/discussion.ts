import { TRPCError } from "@trpc/server"
import z from "zod"
import { db } from "../database.ts"
import { ThreadStatus } from "../generated/prisma/enums.ts"
import { auth0Cache } from "../lib/auth0.ts"
import { authProcedure, router } from "../trpc.ts"

export const discussionRouter = router({
	getThreadsByContentId: authProcedure
		.input(
			z.object({
				contentId: z.string().min(1),
			})
		)
		.query(async ({ input }) => {
			const threads = await db.contentTalkThread.findMany({
				where: {
					contentId: input.contentId,
				},
				orderBy: {
					updatedAt: "desc",
				},
				include: {
					createdBy: true,
					resolvedBy: true,
					comments: {
						orderBy: {
							updatedAt: "asc",
						},
						include: {
							author: true,
						},
					},
				},
			})
			const users = threads
				.flatMap((v) => [v.createdBy, v.resolvedBy, ...v.comments.flatMap((v) => v.author)])
				.filter((v) => v !== null)

			const auth0Users = await auth0Cache.listUsers()
			const auth0User = new Map(
				users.flatMap(({ id }) => {
					const v = auth0Users.data.find((u) => u.user_id === id)
					if (!v) return []
					return [
						[
							id,
							{
								id: id,
								name: v.name ?? v.nickname ?? v.username!,
								email: v.email!,
								username: v.username!,
							},
						],
					] as const
				})
			)

			return { threads: threads, users: auth0User }
		}),

	createThread: authProcedure
		.input(
			z.object({
				contentId: z.string(),
				title: z.string().min(1).max(250).optional(),
				body: z.string().min(1).max(5000),
			})
		)
		.mutation(async (opts) => {
			const content = await db.content.findUnique({
				where: {
					id: opts.input.contentId,
				},
			})

			if (!content) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Content not found",
				})
			}

			return db.contentTalkThread.create({
				data: {
					title: opts.input.title,
					content: { connect: { id: opts.input.contentId } },
					createdBy: { connect: { id: opts.ctx.auth.sub } },
					comments: {
						create: {
							body: opts.input.body,
							author: { connect: { id: opts.ctx.auth.sub } },
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					},
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				include: {
					createdBy: true,
					resolvedBy: true,
					comments: {
						orderBy: {
							updatedAt: "asc",
						},
						include: {
							author: true,
						},
					},
				},
			})
		}),

	addComment: authProcedure
		.input(
			z.object({
				threadId: z.string(),
				body: z.string().min(1).max(5000),
			})
		)
		.mutation(async (opts) => {
			const thread = await db.contentTalkThread.findUnique({
				where: {
					id: opts.input.threadId,
				},
			})

			if (!thread) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Thread not found",
				})
			}

			if (thread.status === ThreadStatus.Archived) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot comment on archived thread",
				})
			}

			return db.contentTalkThread.update({
				where: {
					id: opts.input.threadId,
				},
				data: {
					updatedAt: { set: new Date() },
					comments: {
						create: {
							author: { connect: { id: opts.ctx.auth.sub } },
							body: opts.input.body,
							createdAt: new Date(),
						},
					},
				},
				include: {
					comments: {
						include: {
							author: true,
						},
					},
				},
			})
		}),
	resolveThread: authProcedure
		.input(
			z.object({
				threadId: z.string(),
			})
		)
		.mutation(async (opts) => {
			return db.contentTalkThread.update({
				where: {
					id: opts.input.threadId,
				},
				data: {
					status: ThreadStatus.Resolved,
					resolvedAt: new Date(),
					resolvedBy: { connect: { id: opts.ctx.auth.sub } },
				},
			})
		}),
	reopenThread: authProcedure
		.input(
			z.object({
				threadId: z.string(),
			})
		)
		.mutation(async (opts) => {
			return db.contentTalkThread.update({
				where: {
					id: opts.input.threadId,
				},
				data: {
					status: ThreadStatus.Open,
					resolvedAt: null,
					resolvedBy: { disconnect: true },
				},
			})
		}),
})
