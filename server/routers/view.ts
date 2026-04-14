import {authProcedure, router} from "../trpc.ts";
import {db} from "../database.ts";
import {TRPCError} from "@trpc/server";
import * as jose from "jose";
import {env} from "../env.ts";
import z from "zod";

export const viewRouter = router({
    view: authProcedure.input(z.object({ id: z.string() })).query(async (opts) => {
        const content = await db.content.findUnique({
            where: { id: opts.input.id },
        })
        if (!content) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Content not found",
            })
        }

        if (content.type === "Link") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Content is a link",
                cause: content.url,
            })
        }

        const token = await new jose.SignJWT({ contentId: content.id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("5m")
            .sign(new TextEncoder().encode(env.APP_SECRET))

        return { url: `/content/view?token=${token}` }
    }),
})