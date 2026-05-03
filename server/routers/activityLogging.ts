import { adminProcedure, router } from "../trpc.ts"
import { db } from "../database.ts"
import z from "zod"
import {auth0Cache} from "../lib/auth0.ts";

export const activityLoggingRouter = router({
    listUserActivity: adminProcedure.input(z.object({employeeId: z.string().optional()})).query(async (opts) => {
        const activity = await db.activityLog.findMany({
            where: {employeeId: opts.input.employeeId},
            orderBy: {timestamp: 'desc'},
            take: 100
        })
        return activity
    })
})