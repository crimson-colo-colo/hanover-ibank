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
})