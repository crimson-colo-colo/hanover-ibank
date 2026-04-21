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


})