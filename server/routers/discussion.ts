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
				includeComments: z.boolean().optional(),
			})
		)
		.query(async ({ input }) => {
			const includeComments = input.includeComments ?? true
			return db.contentTalkThread.findMany({
				where: {
					contentId: input.contentId,
				},
				orderBy: {
					createdAt: "asc",
				},
				select: {
					title: true,
					body: true,
					createdBy: {
						select: { id: true },
					},
					comments: includeComments
						? {
								select: {
									authorId: true,
									body: true,
									createdAt: true,
								},
							}
						: undefined,
				},
			})
		}),

	createThread: authProcedure
		.input(
			z.object({
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
			const thread = await db.contentThread.findUnique({
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

			return db.contentTalkThread.u
			id: opts.input.threadId
			,
					author:
			id: opts.ctx.auth.sub
			,
					body: opts.input.body,
					createdAt: new Date(),
					updatedAt
			,
				include:
			author: true,
			,
			)
		}),

	resolveThread: authProcedure
		.input(
			z.object({
				threadId: z.string(),
			})
		)
		.mutation(async (opts) => {
			return db.contentThread.update({
				where: {
					id: opts.input.threadId,
				},
				data: {
					status: ThreadStatus.Resolved,
					resolvedAt: new Date(),
					resolvedById: opts.ctx.auth.sub,
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
			return db.contentThread.update({
				where: {
					id: opts.input.threadId,
				},
				data: {
					status: ThreadStatus.Open,
					resolvedAt: null,
					resolvedById: null,
				},
			})
		}),
})
