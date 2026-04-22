import { TRPCError } from "@trpc/server"
import z from "zod"
import { db } from "../database.ts"
import { ThreadStatus } from "../generated/prisma/enums.ts"
import { authProcedure, router } from "../trpc.ts"

export const discussionRouter = router({
	getThreadsByContentId: authProcedure
		.input(
			z.object({
				contentId: z.string().min(1),
			})
		)
		.query(async ({ input }) => {
			return db.contentTalkThread.findMany({
				where: {
					contentId: input.contentId,
				},
				orderBy: {
					updatedAt: "asc",
				},
				select: {
					id: true,
					title: true,
					createdBy: {
						select: { id: true },
					},
					updatedAt: true,
					createdAt: true,
					status: true,
					resolvedAt: true,
					resolvedBy: { select: { id: true } },
					content: { select: { id: true } },
					comments: {
						select: {
							author: { select: { id: true } },
							body: true,
							createdAt: true,
							updatedAt: true,
						},
						orderBy: {
							updatedAt: "asc",
						},
					},
				},
			})
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
							author: { connect: { id: opts.ctx.auth.sub } },
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					},
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				include: {
					id: true,
					createdBy: true,
					comments: {
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
					id: true,
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
