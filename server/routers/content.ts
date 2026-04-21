import type { HeadObjectOutput } from "@aws-sdk/client-s3"
import { ContentFilter } from "@shared/enum.ts"
import { TRPCError } from "@trpc/server"
import * as jose from "jose"
import z from "zod"
import { auth0Management } from "../auth.ts"
import { db } from "../database.ts"
import { env } from "../env.ts"
import type { Tag } from "../generated/prisma/client.ts"
import {
	ContentStatus,
	type ContentType,
	EmployeeRole,
	TagCategory,
} from "../generated/prisma/enums.ts"
import { getFileTypeFromFile } from "../lib/filetype.ts"
import { isoDateToTimestamp } from "../lib.ts"
import { bucketName, s3 } from "../s3.ts"
import {adminProcedure, authProcedure, router} from "../trpc.ts"

type User = {
	id: string
	name: string
	email: string
	username: string
}

export type ContentListItem = {
	id: string
	title: string
	readonly owner: User
	readonly checkedOutBy: User | null
	favorited: boolean
	ownerId: string
	lastModifiedDate: Date
	expirationDate: Date
	status: ContentStatus
	tags: {
		category: TagCategory
		name: string
	}[]
} & (
	| {
			type: (typeof ContentType)["Link"]
			url: string
	  }
	| {
			type: (typeof ContentType)["Object"]
			objectId: string
			object: HeadObjectOutput
	  }
)

export interface ContentList {
	role: EmployeeRole
	content: ContentListItem[]
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
								tags: {
									some: {
										tagCategory: TagCategory.IntendedAudience,
										tagName: user.role,
									},
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
					tags: true,
				},
			})

			const users = await auth0Management.users.list()

			const metadata = new Map(
				await Promise.all(
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
			)

			return {
				role: user.role,
				content: data.map((content) => {
					const unknownUser = {
						name: "Unknown User",
						email: "unknown",
						username: "unknown",
						avatarUrl: "",
						nickname: null,
						picture: null,
					}
					const owner = users.data.find((u) => u.user_id === content.ownerId) ?? unknownUser
					const checkedOutByUser = content.checkedOutBy
						? (users.data.find((u) => u.user_id === content.checkedOutById) ?? unknownUser)
						: null
					return {
						...content,
						favorited: content.favoritedBy.length > 0,
						owner: {
							id: content.ownerId,
							name: owner.name ?? owner.nickname ?? owner.username!,
							email: owner.email!,
							username: owner.username!,
						} satisfies ContentListItem["owner"],
						checkedOutBy: checkedOutByUser
							? ({
									id: content.checkedOutById!,
									name:
										checkedOutByUser.name ??
										checkedOutByUser.nickname ??
										checkedOutByUser.username!,
									email: checkedOutByUser.email!,
									username: checkedOutByUser.username!,
								} satisfies ContentListItem["checkedOutBy"])
							: null,
						tags: content.tags.map((tag) => ({
							category: tag.tagCategory,
							name: tag.tagName,
						})),
						type: content.type as "Object",
						objectId: content.objectId!,
						object: metadata.get(content.id)!,
					} satisfies ContentListItem
				}),
			}
		}),

	update: authProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(3).max(250),
				ownerId: z.string(),
				lastModifiedDate: z.iso.date(),
				expirationDate: z.iso.date(),
				status: z.enum(Object.values(ContentStatus)),
				tags: z.array(
					z.object({
						category: z.enum(Object.values(TagCategory)),
						name: z.string().min(1).max(50),
					})
				),
			})
		)
		.mutation(async (opts) => {
			const updated = await db.content.update({
				where: { id: opts.input.id },
				data: {
					title: opts.input.title,
					owner: { connect: { id: opts.input.ownerId } },
					lastModifiedDate: isoDateToTimestamp(opts.input.lastModifiedDate),
					expirationDate: isoDateToTimestamp(opts.input.expirationDate),
					status: opts.input.status,
					tags: {
						connectOrCreate: opts.input.tags.map((tag) => ({
							where: {
								contentId_tagCategory_tagName: {
									contentId: opts.input.id,
									tagCategory: tag.category,
									tagName: tag.name,
								},
							},
							create: {
								contentId: opts.input.id,
								tag: {
									connectOrCreate: {
										where: {
											category_name: {
												category: tag.category,
												name: tag.name,
											},
										},
										create: {
											category: tag.category,
											name: tag.name,
										},
									},
								},
							},
						})),
						deleteMany: {
							contentId: opts.input.id,
							NOT: opts.input.tags.map((tag) => ({
								tagCategory: tag.category,
								tagName: tag.name,
							})),
						},
					},
				},
			})
			return updated
		}),

	updateTitle: authProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(3).max(250),
			})
		)
		.mutation(async (opts) => {
			const updated = await db.content.update({
				where: { id: opts.input.id },
				data: {
					title: opts.input.title,
				},
			})
			return updated
		}),

	updateLastModifiedDate: authProcedure
		.input(
			z.object({
				id: z.string(),
				lastModifiedDate: z.iso.date(),
			})
		)
		.mutation(async (opts) => {
			const updated = await db.content.update({
				where: { id: opts.input.id },
				data: {
					lastModifiedDate: isoDateToTimestamp(opts.input.lastModifiedDate),
				},
			})
			return updated
		}),

	updateExpirationDate: authProcedure
		.input(
			z.object({
				id: z.string(),
				expirationDate: z.iso.date(),
			})
		)
		.mutation(async (opts) => {
			const updated = await db.content.update({
				where: { id: opts.input.id },
				data: {
					expirationDate: isoDateToTimestamp(opts.input.expirationDate),
				},
			})
			return updated
		}),
	updateOwner: authProcedure
		.input(z.object({ id: z.string(), ownerId: z.string() }))
		.mutation(async (opts) => {
			await db.content.update({
				where: { id: opts.input.id },
				data: {
					ownerId: opts.input.ownerId,
				},
			})
		}),
	updateStatus: authProcedure
		.input(z.object({ id: z.string(), status: z.enum(Object.values(ContentStatus)) }))
		.mutation(async (opts) => {
			await db.content.update({
				where: { id: opts.input.id },
				data: {
					status: opts.input.status,
				},
			})
		}),
	updateTags: authProcedure
		.input(
			z.object({
				id: z.string(),
				tags: z.array(
					z.object({
						category: z.enum(Object.values(TagCategory)),
						name: z.string().min(1).max(50),
					})
				),
			})
		)
		.mutation(async (opts) => {
			await db.content.update({
				where: { id: opts.input.id },
				data: {
					tags: {
						connectOrCreate: opts.input.tags.map((tag) => ({
							where: {
								contentId_tagCategory_tagName: {
									contentId: opts.input.id,
									tagCategory: tag.category,
									tagName: tag.name,
								},
							},
							create: {
								tag: {
									connectOrCreate: {
										where: {
											category_name: {
												category: tag.category,
												name: tag.name,
											},
										},
										create: {
											category: tag.category,
											name: tag.name,
										},
									},
								},
							},
						})),
						deleteMany: {
							contentId: opts.input.id,
							NOT: opts.input.tags.map((tag) => ({
								tagCategory: tag.category,
								tagName: tag.name,
							})),
						},
					},
				},
			})
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
				include: {
					tags: true,
				},
			})
			if (!content) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Content not found",
				})
			}

			const user = await db.employee.findUnique({
				where: { id: opts.ctx.auth.sub },
			})

			if (!user) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User not found",
				})
			}

			const isAdmin = user.role === "Admin"
			const isOwner = content.checkedOutById === user.id
			const isCheckedOutByAnotherUser =
				content.checkedOutById !== null && content.checkedOutById !== user.id
			const isIntendedAudience =
				content.tags.some((tag) => tag.tagCategory === TagCategory.IntendedAudience) &&
				content.tags.some(
					(tag) => tag.tagCategory === TagCategory.IntendedAudience && tag.tagName === user.role
				)

			if (isCheckedOutByAnotherUser && !isOwner && !isAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Content is checked out by another user",
				})
			}

			if (!isIntendedAudience && !isOwner && !isAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "User cannot edit content not intended for their role",
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
					size: buffer.length,
					mimeType: fileType,
				},
			})
		}),

	updateLink: authProcedure
		.input(
			z.object({
				id: z.string(),
				url: z.url(),
			})
		)
		.mutation(async (opts) => {
			const content = await db.content.findUnique({
				where: { id: opts.input.id },
				include: {
					tags: true,
				},
			})
			if (!content) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Content not found",
				})
			}

			const user = await db.employee.findUnique({
				where: { id: opts.ctx.auth.sub },
			})

			if (!user) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User not found",
				})
			}

			const isAdmin = user.role === "Admin"
			const isOwner = content.checkedOutById === user.id
			const isCheckedOutByAnotherUser =
				content.checkedOutById !== null && content.checkedOutById !== user.id
			const isIntendedAudience =
				content.tags.some((tag) => tag.tagCategory === TagCategory.IntendedAudience) &&
				content.tags.some(
					(tag) => tag.tagCategory === TagCategory.IntendedAudience && tag.tagName === user.role
				)

			if (isCheckedOutByAnotherUser && !isOwner && !isAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Content is checked out by another user",
				})
			}
			if (!isIntendedAudience && !isOwner && !isAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "User cannot edit content not intended for their role",
				})
			}
			if (content.type !== "Link") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Content is not a link",
				})
			}

			await db.content.update({
				where: { id: opts.input.id },
				data: {
					url: opts.input.url,
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
		const favorite = await db.favoriteContent.upsert({
			where: {
				contentId_employeeId: {
					contentId: opts.input.id,
					employeeId: opts.ctx.auth.sub,
				},
			},
			create: {
				contentId: opts.input.id,
				employeeId: opts.ctx.auth.sub,
			},
			update: {},
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
	listFavorites: authProcedure.query(async (opts): Promise<ContentList> => {
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
			where: {
				favoritedBy: {
					some: {
						employeeId: opts.ctx.auth.sub,
					},
				},
			},
			include: {
				owner: true,
				tags: true,
				checkedOutBy: true,
			},
		})

		const metadata = new Map(
			await Promise.all(
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
		)

		const users = await auth0Management.users.list()

		return {
			role: user.role,
			content: data.map((content) => {
				const unknownUser = {
					name: "Unknown User",
					email: "unknown",
					username: "unknown",
					avatarUrl: "",
				}
				const owner = users.data.find((u) => u.user_id === content.ownerId) ?? unknownUser
				const checkedOutByUser = content.checkedOutBy
					? (users.data.find((u) => u.user_id === content.checkedOutById) ?? unknownUser)
					: null
				return {
					...content,
					owner: {
						...content.owner,
						name: owner.name ?? owner.username!,
						email: owner.email!,
						username: owner.username!,
					} satisfies ContentListItem["owner"],
					checkedOutBy: checkedOutByUser
						? ({
								id: content.checkedOutById!,
								name: checkedOutByUser.name ?? checkedOutByUser.username!,
								email: checkedOutByUser.email!,
								username: checkedOutByUser.username!,
							} satisfies ContentListItem["checkedOutBy"])
						: null,
					favorited: true,
					tags: content.tags.map((tag) => ({
						category: tag.tagCategory,
						name: tag.tagName,
					})),
					type: content.type as "Object",
					objectId: content.objectId!,
					object: metadata.get(content.id)!,
				} satisfies ContentListItem
			}),
		}
	}),
	checkOut: authProcedure.input(z.object({ id: z.string() })).mutation(async (opts) => {
		const user = await db.employee.findUnique({
			where: {
				id: opts.ctx.auth.sub,
			},
		})

		if (!user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "User not found",
			})
		}

		const content = await db.content.findUnique({
			where: { id: opts.input.id },
			include: {
				tags: true,
			},
		})

		if (!content) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Content not found",
			})
		}

		const isIntendedAudience = content.tags.some(
			(tag) => tag.tagCategory === TagCategory.IntendedAudience && tag.tagName === user.role
		)
		if (!isIntendedAudience && user.role !== EmployeeRole.Admin) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "User cannot check out content not intended for their role",
			})
		}
		if (content.checkedOutById !== null) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Content is already checked out",
			})
		}

		const updated = await db.content.update({
			where: { id: opts.input.id },
			data: { checkedOutById: user.id },
		})
		return updated
	}),
	checkIn: authProcedure.input(z.object({ id: z.string() })).mutation(async (opts) => {
		const user = await db.employee.findUnique({
			where: {
				id: opts.ctx.auth.sub,
			},
		})
		if (!user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "User not found",
			})
		}
		const content = await db.content.findUnique({
			where: { id: opts.input.id },
		})

		if (!content) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Content not found",
			})
		}

		if (content.checkedOutById === null) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Content not checked out",
			})
		}

		if (content.checkedOutById !== user.id && user.role !== EmployeeRole.Admin) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "User cannot check in content checked out by another user",
			})
		}

		const updated = await db.content.update({
			where: { id: opts.input.id },
			data: { checkedOutById: null },
		})
		return updated
	}),

	listTagsByCategory: authProcedure.query(async (opts) => {
		const tags: Record<string, Tag[]> = {}
		for (const tag of await db.tag.findMany()) {
			if (!tags[tag.category]) {
				tags[tag.category] = []
			}
			tags[tag.category].push(tag)
		}
		return tags
	}),

	get: authProcedure.input(z.object({ id: z.string() })).query(async (opts) => {
		const content = await db.content.findUnique({
			where: { id: opts.input.id },
			include: {
				owner: true,
				checkedOutBy: true,
				favoritedBy: {
					where: {
						employeeId: opts.ctx.auth.sub,
					},
				},
				tags: true,
			},
		})

		if (!content) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Content not found",
			})
		}

		const users = await auth0Management.users.list()

		const objectMetadata =
			content.type === "Object"
				? await s3.headObject({ Bucket: bucketName, Key: content.objectId! })
				: null

		const unknownUser = {
			name: "Unknown User",
			email: "unknown",
			username: "unknown",
			avatarUrl: "",
		}
		const owner = users.data.find((u) => u.user_id === content.ownerId) ?? unknownUser
		const checkedOutByUser = content.checkedOutBy
			? (users.data.find((u) => u.user_id === content.checkedOutById) ?? unknownUser)
			: null

		const contentItem = {
			...content,
			favorited: content.favoritedBy.length > 0,
			owner: {
				id: content.ownerId,
				name: owner.name ?? owner.username!,
				email: owner.email!,
				username: owner.username!,
			} satisfies ContentListItem["owner"],
			checkedOutBy: checkedOutByUser
				? ({
						id: content.checkedOutById!,
						name: checkedOutByUser.name ?? checkedOutByUser.username!,
						email: checkedOutByUser.email!,
						username: checkedOutByUser.username!,
					} satisfies ContentListItem["checkedOutBy"])
				: null,
			tags: content.tags.map((tag) => ({
				category: tag.tagCategory,
				name: tag.tagName,
			})),
			type: content.type as "Object",
			objectId: content.objectId!,
			object: objectMetadata!,
		} satisfies ContentListItem

		return {
			content: contentItem,
		}
	}),

	getFileStats : authProcedure.query(async (opts) => {
		const content = await db.content.findMany({
			where: {type : "Object"},
			select: {
				mimeType: true,
				size: true,
			},
		})
		const grouped = new Map<string, { count: number; totalSize: number}>()

		for(const {mimeType, size} of content) {
			const key = mimeType ?? "unknown"
			const existing = grouped.get(key)
			if(existing){
				existing.count += 1
				existing.totalSize += size ?? 0
			}
			else {
				grouped.set(key, {count: 1, totalSize: size ?? 0})
			}
		}

		return Array.from(grouped.entries()).map(([type, {count, totalSize}]) => ({
			type,
			count,
			totalSize,
		}))




	}),

	getUploadStats: authProcedure.query(async () =>{
		const contents = await db.content.findMany({
			select: {
				type: true,
				createdAt: true,
			},
		})

		const grouped = new Map<string, {Files: number; Links: number }>()

		for (const { type, createdAt } of contents){
			const month = createdAt.toLocaleString("en-us", { month: "short"})
			const existing = grouped.get(month)
			if(existing){
				if(type === "Object"){
					existing.Files++
				}
				else{
					existing.Links++
				}
			}
			else {
				grouped.set(month, {
					Files: type === "Object" ? 1 : 0,
					Links: type === "Link" ? 1 : 0
				})
			}
		}

		const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

		return monthOrder.map((month) => ({
			month,
			Files: grouped.get(month)?.Files ?? 0,
			Links: grouped.get(month)?.Links ?? 0,
		}))
	}),

})
