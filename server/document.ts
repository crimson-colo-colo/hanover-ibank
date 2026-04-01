import { z } from "zod";
import { router, publicProcedure} from "./trpc.ts";
import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

const documentStatusEnum = z.enum([
  "PENDING",
  "NEEDS_WORK",
  "APPROVED",
  "REJECTED",
]);

const createDocumentInput = z.object({
  title: z.string().min(1, "Title is required"),
  expirationDate: z.string().optional()
    .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)),
      {
        message: "Expiration date must be a valid date",
      }),
  status: documentStatusEnum.optional()
});

const updateDocumentStatusInput = z.object({
  documentId: z.string().uuid(),
  status: documentStatusEnum
});

export const documentRouter = router({
  createDocument: publicProcedure.input(createDocumentInput)
    .mutation(async ({ input}) =>
    { return prisma.document.create({
      data: {
      title: input.title,
        expirationDate
    : input.expirationDate
        ? new Date(input.expirationDate)
        : null,
        status: input.status ?? "PENDING",
    },
    });
    }),
  updateDocumentStatus: publicProcedure
    .input(updateDocumentStatusInput)
    .mutation(async ({ input }) => {
      return prisma.document.update({
        where: {
          id: input.documentId,
        },
        data: {
          status: input.status,
        },
      });
    }),
});

