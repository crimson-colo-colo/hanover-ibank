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
            return db.contentThread.findMany({
                where: {
                    contentId: input.contentId,
                },
                orderBy: {
                    createdAt: "asc",
                },
                include: {
                    createdBy: true,
                    resolvedBy: true,
                    comments: {
                        where: {
                            deletedAt: null,
                        },
                        orderBy: {
                            createdAt: "asc",
                        },
                        include: {
                            author: true,
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
                sectionLabel: z.string().min(1).max(100).optional(),
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

            return db.contentThread.create({
                data: {
                    contentId: opts.input.contentId,
                    title: opts.input.title,
                    sectionLabel: opts.input.sectionLabel,
                    createdById: opts.ctx.auth.sub,
                    comments: {
                        create: {
                            authorId: opts.ctx.auth.sub,
                            body: opts.input.body,
                        },
                    },
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

            return db.threadComment.create({
                data: {
                    threadId: opts.input.threadId,
                    authorId: opts.ctx.auth.sub,
                    body: opts.input.body,
                },
                include: {
                    author: true,
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