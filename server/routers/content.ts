import type { HeadObjectOutput } from "@aws-sdk/client-s3"
import { ContentFilter } from "@shared/enum.ts"
import { TRPCError } from "@trpc/server"
import * as jose from "jose"
import z from "zod"
import { auth0Management } from "../auth.ts"
import { db } from "../database.ts"
import { env } from "../env.ts"
import { ContentStatus, DocumentType, EmployeeRole } from "../generated/prisma/enums.ts"
import { getFileTypeFromFile } from "../lib/filetype.ts"
import { getGravatarUrl, isoDateToTimestamp } from "../lib.ts"
import { bucketName, s3 } from "../s3.ts"
import { authProcedure, publicProcedure, router } from "../trpc.ts"

export type ContentListItem = {
	id: string
	title: string
	readonly owner: {
		id: string
		name: string
		email: string
		username: string
		avatarUrl: string
	}
	favorited: boolean
	ownerId: string
	lastModifiedDate: Date
	expirationDate: Date
	documentType: DocumentType
	status: ContentStatus
	intendedAudience: EmployeeRole[]
	checkedOutById: string
} & (
	| {
			type: "Link"
			url: string
	  }
	| {
			type: "Object"
			objectId: string
	  }
)

export interface ContentList {
	role: EmployeeRole
	content: ContentListItem[]
	objectMetadata: Map<string, HeadObjectOutput>
}

export const contentRouter = router({
	list: authProcedure
		.input(z.object({ filter: z.enum(Object.values(ContentFilter)) }))
		.query(async (opts): Promise<ContentList> => {
			const user = await db.employee.findUnique({
				where: {
					id: opts.ctx.auth.sub,
				},
			})
			if (!user?.role) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "user does not exist",
				})
			}
			const data = await db.content.findMany({
				where:
					user.role === EmployeeRole.Admin || opts.input.filter === ContentFilter.All
						? {
								// no filters; fetch everything
							}
						: {
								intendedAudience: {
									has: user.role,
								},
							},
				include: {
					owner: true,
					checkedOutBy: true,
					favoritedBy: {
						where: {
							employeeId: opts.ctx.auth.sub,
						},
					},
				},
			})

			const users = await auth0Management.users.list()

			const metadata = await Promise.all(
				data
					.filter((content) => content.type === "Object")
					.map(
						async (content) =>
							[
								content.id,
								await s3.headObject({ Bucket: bucketName, Key: content.objectId! }),
							] as const
					)
			)

			return {
				role: user.role,
				content: data.map((content) => {
					const owner = users.data.find((u) => u.user_id === content.ownerId) ?? {
						name: "Unknown User",
						email: "unknown",
						username: "unknown",
						avatarUrl: "",
					}
					return {
						...content,
						favorited: content.favoritedBy.length > 0,
						owner: {
							...content.owner,
							name: owner.name ?? owner.nickname ?? owner.username!,
							email: owner.email!,
							username: owner.username!,
							avatarUrl: owner.picture || getGravatarUrl(owner.email!),
						} satisfies ContentListItem["owner"],
					} as ContentListItem
				}),
				objectMetadata: new Map(metadata),
			}
		}),

	update: authProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(3).max(250),
				ownerId: z.string(),
				intendedAudience: z.array(z.enum(Object.values(EmployeeRole))).min(1),
				lastModifiedDate: z.iso.date(),
				expirationDate: z.iso.date(),
				documentType: z.enum(Object.values(DocumentType)),
				status: z.enum(Object.values(ContentStatus)),
			})
		)
		.mutation(async (opts) => {
			const updated = await db.content.update({
				where: { id: opts.input.id },
				data: {
					title: opts.input.title,
					owner: { connect: { id: opts.input.ownerId } },
					intendedAudience: opts.input.intendedAudience,
					lastModifiedDate: isoDateToTimestamp(opts.input.lastModifiedDate),
					expirationDate: isoDateToTimestamp(opts.input.expirationDate),
					documentType: opts.input.documentType,
					status: opts.input.status,
				},
			})
			return updated
		}),

	download: authProcedure.input(z.object({ id: z.string() })).query(async (opts) => {
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

		return { url: `/content/download?token=${token}` }
	}),

	updateFile: authProcedure
		.input(
			z.object({
				id: z.string(),
				file: z.string(),
			})
		)
		.mutation(async (opts) => {
			const content = await db.content.findUnique({
				where: { id: opts.input.id },
			})
			if (!content) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Content not found",
				})
			}

			const user = await db.employee.findUnique({
				where: {id: opts.ctx.auth.sub}
			})

			const isAdmin = user?.role === "Admin"
			const isOwner = content.checkedOutById === user?.id

			if (content.checkedOutById && !isOwner && !isAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Content is checked out by another user",
				})
			}
			if (content.type !== "Object") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Content is not a file",
				})
			}

			const buffer = Buffer.from(opts.input.file, "base64")
			const fileType = await getFileTypeFromFile(content.title, buffer)
			await s3.putObject({
				Bucket: bucketName,
				Key: content.objectId!,
				Body: buffer,
				Metadata: {
					filetype: fileType,
				},
			})
			await db.content.update({
				where: { id: opts.input.id },
				data: {
					lastModifiedDate: new Date(),
				},
			})
		}),

	delete: authProcedure.input(z.object({ ids: z.array(z.string()) })).mutation(async (opts) => {
		const contents = await db.content.findMany({
			where: { id: { in: opts.input.ids } },
		})

		const objectsToDelete = contents
			.filter((content) => content.type === "Object")
			.map((content) => content.objectId!)

		await Promise.all([
			db.content.deleteMany({
				where: { id: { in: opts.input.ids } },
			}),
			...objectsToDelete.map((objectId) => s3.deleteObject({ Bucket: bucketName, Key: objectId })),
		])
	}),
	favorite: authProcedure.input(z.object({ id: z.string() })).mutation(async (opts) => {
		const favorite = await db.favoriteContent.create({
			data: {
				contentId: opts.input.id,
				employeeId: opts.ctx.auth.sub,
			},
		})
		return favorite
	}),
	unfavorite: authProcedure.input(z.object({ id: z.string() })).mutation(async (opts) => {
		const unfavorite = await db.favoriteContent.delete({
			where: {
				contentId_employeeId: {
					contentId: opts.input.id,
					employeeId: opts.ctx.auth.sub,
				},
			},
		})
		return unfavorite
	}),
	listFavorites: authProcedure.query(async (opts) => {
		const data = await db.content.findMany({
			where: {
				favoritedBy: {
					some: {
						employeeId: opts.ctx.auth.sub,
					},
				},
			},
		})

		const metadata = await Promise.all(
			data
				.filter((content) => content.type === "Object")
				.map(
					async (content) =>
						[
							content.id,
							await s3.headObject({ Bucket: bucketName, Key: content.objectId! }),
						] as const
				)
		)

		return {
			content: data,
			objectMetadata: new Map(metadata),
		}
	}),
	checkIn: authProcedure.input(z.object({ id: z.string() })).mutation(async (opts) => {
		//verify user
		const user = await db.employee.findUnique({
			where: {
				id: opts.ctx.auth.sub,
			},
		})

		if (!user) throw new Error("No user found.")

		const content = await db.content.findUnique({
			where: { id: opts.input.id },
		})

		if (!content) {
			throw new Error("Content does not exist")
		}

		if (!content.intendedAudience.includes(user.role)) {
			throw new Error("User not in the intended audience")
		}
		if (content.checkedOutById !== null) {
			throw new Error("Content already checked out")
		}

		const updated = await db.content.update({
			where: { id: user.id },
			data: { checkedOutById: user.id },
		})
		return updated
	}),
	checkOut: authProcedure.input(z.object({ id: z.string() })).mutation(async (opts) => {
		const user = await db.employee.findUnique({
			where: {
				id: opts.ctx.auth.sub,
			},
		})
		if (!user) {
			throw new Error("No user found.")
		}
		const content = await db.content.findUnique({
			where: { id: opts.input.id },
		})

		if (!content) {
			throw new Error("Content does not exist")
		}

		if (content.checkedOutById === null) {
			throw new Error("Content not checked out")
		}

		const updated = await db.content.update({
			where: { id: user.id },
			data: { checkedOutById: null },
		})
		return updated
	}),
})
