// noinspection UnnecessaryLocalVariableJS

import { ContentFilter } from "@shared/enum.ts"
import type { ContentList, ContentListItem } from "@shared/types.ts"
import { TRPCError } from "@trpc/server"
import * as jose from "jose"
import z from "zod"
import { db } from "../database.ts"
import { env } from "../env.ts"
import type { Employee, Tag } from "../generated/prisma/client.ts"
import {
	ContentStatus,
	ContentType,
	EmployeeRole,
	NotificationType,
	TagCategory,
} from "../generated/prisma/enums.ts"
import { fetchAndTransformToContentListItems, getContentInclude } from "../lib/content.ts"
import { embedFile } from "../lib/embedFile.ts"
import { getFileTypeFromFile } from "../lib/filetype.ts"
import {
	notifyContentCheckedIn,
	notifyContentCheckedOut,
	notifyContentEdited,
	notifyContentTransferred,
} from "../lib/notify.ts"
import { search } from "../lib/openrouter.ts"
import { isoDateToTimestamp } from "../lib.ts"
import { bucketName, s3 } from "../s3.ts"
import { authProcedure, router } from "../trpc.ts"
import { discussionRouter } from "./discussion.ts"

export const contentRouter = router({
	discussion: discussionRouter,
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
				include: getContentInclude(opts.ctx.auth.sub),
			})

			const sums = await db.recentTimestamps.groupBy({
				by: ["contentId"],
				_sum: {
					viewCount: true,
				},
				orderBy: {
					_sum: {
						viewCount: "desc",
					},
				},
			})

			const items = await fetchAndTransformToContentListItems(data, opts.ctx.auth.sub)

			const content = items.map((item) => {
				const sum = sums.find((s) => s.contentId === item.id)
				return {
					...item,
					viewCount: sum?._sum.viewCount ?? 0,
				}
			})

			return {
				role: user.role,
				content: content,
			}
		}),

	getRecentlyViewed: authProcedure
		.input(z.object({ limit: z.number().nonnegative().max(10) }))
		.query(async (opts): Promise<ContentListItem[]> => {
			const recentlyViewed = await db.recentTimestamps.findMany({
				where: { employeeId: opts.ctx.auth.sub },
				orderBy: { recentlyViewed: "desc" },
				take: opts.input.limit,
				include: {
					content: {
						include: getContentInclude(opts.ctx.auth.sub),
					},
				},
			})

			return fetchAndTransformToContentListItems(
				recentlyViewed.map((r) => r.content),
				opts.ctx.auth.sub
			)
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
				include: { tags: true },
			})
			await embedFile(updated)
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
			const beforeTitle = await db.content.findUnique({
				where: { id: opts.input.id },
				select: {
					title: true,
				},
			})
			if (opts.input.title !== beforeTitle?.title) {
				const updated = await db.content.update({
					where: { id: opts.input.id },
					data: {
						title: opts.input.title,
					},
					include: { tags: true },
				})
				await embedFile(updated)

				await db.recentTimestamps.update({
					where: {
						employeeId_contentId: {
							contentId: opts.input.id,
							employeeId: opts.ctx.auth.sub,
						},
					},
					data: {
						recentlyEdited: new Date(),
					},
				})

				if (updated.ownerId !== opts.ctx.auth.sub) {
					const actor = (await db.employee.findUnique({
						where: { id: opts.ctx.auth.sub },
					})) as Employee
					const notification = await db.notification.create({
						data: {
							employeeId: updated.ownerId,
							contentId: updated.id,
							type: NotificationType.ContentEdited,
							actorId: opts.ctx.auth.sub,
						},
					})
					await notifyContentEdited(notification, updated, actor)
				}

				return updated
			}
		}),

	updateLastModifiedDate: authProcedure
		.input(
			z.object({
				id: z.string(),
				lastModifiedDate: z.iso.date(),
			})
		)
		.mutation(async (opts) => {
			const beforeLastModifiedDate = await db.content.findUnique({
				where: { id: opts.input.id },
				select: {
					lastModifiedDate: true,
				},
			})
			if (
				opts.input.lastModifiedDate !==
				beforeLastModifiedDate?.lastModifiedDate.toISOString().split("T")[0]
			) {
				const updated = await db.content.update({
					where: { id: opts.input.id },
					data: {
						lastModifiedDate: isoDateToTimestamp(opts.input.lastModifiedDate),
					},
					include: { tags: true },
				})
				await db.recentTimestamps.update({
					where: {
						employeeId_contentId: {
							contentId: opts.input.id,
							employeeId: opts.ctx.auth.sub,
						},
					},
					data: {
						recentlyEdited: new Date(),
					},
				})

				if (updated.ownerId !== opts.ctx.auth.sub) {
					const actor = (await db.employee.findUnique({
						where: { id: opts.ctx.auth.sub },
					})) as Employee
					const notification = await db.notification.create({
						data: {
							employeeId: updated.ownerId,
							contentId: updated.id,
							type: NotificationType.ContentEdited,
							actorId: opts.ctx.auth.sub,
						},
					})
					await notifyContentEdited(notification, updated, actor)
				}

				await embedFile(updated)
				return updated
			}
		}),

	updateExpirationDate: authProcedure
		.input(
			z.object({
				id: z.string(),
				expirationDate: z.iso.date(),
			})
		)
		.mutation(async (opts) => {
			const beforeExpirationDate = await db.content.findUnique({
				where: { id: opts.input.id },
				select: { expirationDate: true },
			})
			if (
				opts.input.expirationDate !==
				beforeExpirationDate?.expirationDate.toISOString().split("T")[0]
			) {
				const updated = await db.content.update({
					where: { id: opts.input.id },
					data: {
						expirationDate: isoDateToTimestamp(opts.input.expirationDate),
					},
					include: {
						tags: true,
					},
				})

				await db.recentTimestamps.update({
					where: {
						employeeId_contentId: {
							contentId: opts.input.id,
							employeeId: opts.ctx.auth.sub,
						},
					},
					data: {
						recentlyEdited: new Date(),
					},
				})

				if (updated.ownerId !== opts.ctx.auth.sub) {
					const actor = (await db.employee.findUnique({
						where: { id: opts.ctx.auth.sub },
					})) as Employee
					const notification = await db.notification.create({
						data: {
							employeeId: updated.ownerId,
							contentId: updated.id,
							type: NotificationType.ContentEdited,
							actorId: opts.ctx.auth.sub,
						},
					})
					await notifyContentEdited(notification, updated, actor)
				}

				await embedFile(updated)

				return updated
			}
		}),
	updateOwner: authProcedure
		.input(z.object({ id: z.string(), ownerId: z.string() }))
		.mutation(async (opts) => {
			const beforeOwnerId = await db.content.findUnique({
				where: { id: opts.input.id },
			})

			if (opts.input.ownerId !== beforeOwnerId?.ownerId) {
				const updated = await db.content.update({
					where: { id: opts.input.id },
					data: {
						ownerId: opts.input.ownerId,
					},
					include: { tags: true },
				})
				await db.recentTimestamps.update({
					where: {
						employeeId_contentId: {
							contentId: opts.input.id,
							employeeId: opts.ctx.auth.sub,
						},
					},
					data: {
						recentlyEdited: new Date(),
					},
				})
				const actor = (await db.employee.findUnique({
					where: { id: opts.ctx.auth.sub },
				})) as Employee
				const notification = await db.notification.create({
					data: {
						employeeId: opts.input.ownerId,
						type: NotificationType.ContentTransferred,
						contentId: opts.input.id,
						actorId: opts.ctx.auth.sub,
					},
				})
				await notifyContentTransferred(notification, updated, actor)

				await embedFile(updated)

				return updated
			}
		}),
	updateStatus: authProcedure
		.input(z.object({ id: z.string(), status: z.enum(Object.values(ContentStatus)) }))
		.mutation(async (opts) => {
			const beforeStatus = await db.content.findUnique({
				where: { id: opts.input.id },
				select: { status: true },
			})
			if (opts.input.status !== beforeStatus?.status) {
				const updated = await db.content.update({
					where: { id: opts.input.id },
					data: {
						status: opts.input.status,
					},
					include: { tags: true },
				})
				await db.recentTimestamps.update({
					where: {
						employeeId_contentId: {
							contentId: opts.input.id,
							employeeId: opts.ctx.auth.sub,
						},
					},
					data: {
						recentlyEdited: new Date(),
					},
				})

				if (updated.ownerId !== opts.ctx.auth.sub) {
					const actor = (await db.employee.findUnique({
						where: { id: opts.ctx.auth.sub },
					})) as Employee
					const notification = await db.notification.create({
						data: {
							employeeId: updated.ownerId,
							contentId: updated.id,
							type: NotificationType.ContentEdited,
							actorId: opts.ctx.auth.sub,
						},
					})
					await notifyContentEdited(notification, updated, actor)
				}

				await embedFile(updated)

				return updated
			}
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
			const beforeTags = await db.content.findUnique({
				where: { id: opts.input.id },
				select: { tags: true },
			})
			const changed =
				opts.input.tags.length !== beforeTags?.tags.length ||
				opts.input.tags.some(
					(tag) =>
						!beforeTags?.tags.some((t) => t.tagCategory === tag.category && t.tagName === tag.name)
				) ||
				beforeTags?.tags.some(
					(t) =>
						!opts.input.tags.some((tag) => tag.category === t.tagCategory && tag.name === t.tagName)
				)
			if (changed) {
				const updated = await db.content.update({
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
					include: {
						tags: true,
					},
				})
				await db.recentTimestamps.update({
					where: {
						employeeId_contentId: {
							contentId: opts.input.id,
							employeeId: opts.ctx.auth.sub,
						},
					},
					data: {
						recentlyEdited: new Date(),
					},
				})

				if (updated.ownerId !== opts.ctx.auth.sub) {
					const actor = (await db.employee.findUnique({
						where: { id: opts.ctx.auth.sub },
					})) as Employee
					const notification = await db.notification.create({
						data: {
							employeeId: updated.ownerId,
							contentId: updated.id,
							type: NotificationType.ContentEdited,
							actorId: opts.ctx.auth.sub,
						},
					})
					await notifyContentEdited(notification, updated, actor)
				}

				await embedFile(updated)

				return updated
			}
		}),

	updateRecentlyViewedTimestamp: authProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.mutation(async (opts) => {
			await db.recentTimestamps.update({
				where: {
					employeeId_contentId: {
						contentId: opts.input.id,
						employeeId: opts.ctx.auth.sub,
					},
				},
				data: {
					recentlyViewed: new Date(),
				},
			})
		}),

	incrementContentViewCount: authProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async (opts) => {
			await db.recentTimestamps.update({
				where: {
					employeeId_contentId: {
						contentId: opts.input.id,
						employeeId: opts.ctx.auth.sub,
					},
				},
				data: {
					viewCount: {
						increment: 1,
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

		await db.recentTimestamps.update({
			where: {
				employeeId_contentId: {
					contentId: opts.input.id,
					employeeId: opts.ctx.auth.sub,
				},
			},
			data: {
				recentlyViewed: new Date(),
			},
		})

		await db.recentTimestamps.update({
			where: {
				employeeId_contentId: {
					contentId: opts.input.id,
					employeeId: opts.ctx.auth.sub,
				},
			},
			data: {
				viewCount: {
					increment: 1,
				},
			},
		})

		return { url: `/content/download?token=${token}` }
	}),

	updateFile: authProcedure
		.input(
			z.object({
				id: z.string(),
				file: z.base64(),
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
			const updated = await db.content.update({
				where: { id: opts.input.id },
				data: {
					lastModifiedDate: new Date(),
				},
			})

			await db.recentTimestamps.update({
				where: {
					employeeId_contentId: {
						contentId: opts.input.id,
						employeeId: opts.ctx.auth.sub,
					},
				},
				data: {
					recentlyEdited: new Date(),
				},
			})
			if (updated.ownerId !== opts.ctx.auth.sub) {
				const actor = (await db.employee.findUnique({
					where: { id: opts.ctx.auth.sub },
				})) as Employee
				const notification = await db.notification.create({
					data: {
						employeeId: updated.ownerId,
						contentId: updated.id,
						type: NotificationType.ContentEdited,
						actorId: opts.ctx.auth.sub,
					},
				})
				await notifyContentEdited(notification, updated, actor)
			}
			await embedFile(content)
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

			const updated = await db.content.update({
				where: { id: opts.input.id },
				data: {
					url: opts.input.url,
					lastModifiedDate: new Date(),
				},
				include: { tags: true },
			})
			if (updated.ownerId !== opts.ctx.auth.sub) {
				const actor = (await db.employee.findUnique({
					where: { id: opts.ctx.auth.sub },
				})) as Employee
				const notification = await db.notification.create({
					data: {
						employeeId: updated.ownerId,
						contentId: updated.id,
						type: NotificationType.ContentEdited,
						actorId: opts.ctx.auth.sub,
					},
				})
				await notifyContentEdited(notification, updated, actor)
			}
			await embedFile(updated)
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
	bulkUnFavorite: authProcedure
		.input(z.object({ ids: z.array(z.string()) }))
		.mutation(async (opts) => {
			await Promise.all([
				db.favoriteContent.deleteMany({
					where: {
						content: {
							id: {
								in: opts.input.ids,
							},
						},
						employee: {
							id: opts.ctx.auth.sub,
						},
					},
				}),
			])
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
			include: getContentInclude(opts.ctx.auth.sub),
		})

		return {
			role: user.role,
			content: await fetchAndTransformToContentListItems(data, opts.ctx.auth.sub),
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

		if (updated.ownerId !== opts.ctx.auth.sub) {
			const notification = await db.notification.create({
				data: {
					type: NotificationType.ContentCheckedOut,
					actorId: opts.ctx.auth.sub,
					employeeId: content.ownerId,
					contentId: content.id,
				},
			})
			await notifyContentCheckedOut(notification, content, user)
		}

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

		if (updated.ownerId !== opts.ctx.auth.sub) {
			const notification = await db.notification.create({
				data: {
					type: NotificationType.ContentCheckedIn,
					actorId: opts.ctx.auth.sub,
					employeeId: content.ownerId,
					contentId: content.id,
				},
			})
			await notifyContentCheckedIn(notification, content, user)
		}

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
			include: getContentInclude(opts.ctx.auth.sub),
		})

		if (!content) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Content not found",
			})
		}

		const contentItems = await fetchAndTransformToContentListItems([content], opts.ctx.auth.sub)

		return {
			content: contentItems[0],
		}
	}),

	search: authProcedure.input(z.object({ query: z.string() })).query(async (opts) => {
		const results = await search(opts.input.query)
		const ids = results.map(({ id }) => id)
		const rows = await db.content.findMany({ where: { id: { in: ids } } })
		const byId = new Map(rows.map((r) => [r.id, r]))
		return ids.map((id) => byId.get(id)).filter((r) => r !== undefined)
	}),

	getFileStats: authProcedure.query(async (opts) => {
		const content = await db.content.findMany({
			where: {
				type: ContentType.Object,
			},
		})
		const objects = await Promise.all(
			content.map((content) =>
				s3
					.headObject({
						Bucket: bucketName,
						Key: content.objectId!,
					})
					.then((head) => [
						{
							type: head.Metadata?.filetype ?? head.ContentType ?? "unknown",
							size: head.ContentLength ?? 0,
						},
					])
					.catch(() => [])
			)
		).then((results) => results.flat())

		const grouped = new Map<string, { count: number; totalSize: number }>()

		for (const { type, size } of objects) {
			const existing = grouped.get(type)
			if (existing) {
				existing.count += 1
				existing.totalSize += size ?? 0
			} else {
				grouped.set(type, { count: 1, totalSize: size ?? 0 })
			}
		}

		return Array.from(grouped.entries()).map(([type, { count, totalSize }]) => ({
			type,
			count,
			totalSize,
		}))
	}),

	getUploadStats: authProcedure.query(async () => {
		const contents = await db.content.findMany({
			where: {
				createdAt: {
					gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 12), // last 12 months
				},
			},
			select: {
				type: true,
				createdAt: true,
			},
		})

		const grouped = new Map<string, { Files: number; Links: number }>()

		for (const { type, createdAt } of contents) {
			const month = createdAt.toLocaleString("en-us", { month: "short" })
			const existing = grouped.get(month)
			if (existing) {
				if (type === "Object") {
					existing.Files++
				} else {
					existing.Links++
				}
			} else {
				grouped.set(month, {
					Files: type === "Object" ? 1 : 0,
					Links: type === "Link" ? 1 : 0,
				})
			}
		}

		const monthOrder = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		]

		return monthOrder.map((month) => ({
			month,
			Files: grouped.get(month)?.Files ?? 0,
			Links: grouped.get(month)?.Links ?? 0,
		}))
	}),

	getContentViewTotals: authProcedure
		.input(z.object({ type: z.enum(Object.values(ContentType)) }))
		.query(async (opts) => {
			const sums = await db.recentTimestamps.groupBy({
				by: ["contentId"],
				where: {
					content: {
						type: opts.input.type,
					},
				},
				_sum: {
					viewCount: true,
				},
				orderBy: {
					_sum: {
						viewCount: "desc",
					},
				},
				take: 10,
			})

			const contentDetails = await db.content.findMany({
				where: {
					id: { in: sums.map((entry) => entry.contentId) },
				},
				include: getContentInclude(opts.ctx.auth.sub),
			})

			// sort contentDetails in the same order as sums
			contentDetails.sort((a, b) => {
				const aIndex = sums.findIndex((s) => s.contentId === a.id)
				const bIndex = sums.findIndex((s) => s.contentId === b.id)
				return aIndex - bIndex
			})

			const items = await fetchAndTransformToContentListItems(contentDetails, opts.ctx.auth.sub)
			return items.map((item) => {
				const sum = sums.find((s) => s.contentId === item.id)
				return {
					...item,
					viewCount: sum?._sum.viewCount ?? 0,
				}
			})
		}),

	getExpiringContent: authProcedure.query(async (opts) => {
		const expiringContent = await db.content.findMany({
			where: {
				ownerId: opts.ctx.auth.sub,
			},
			orderBy: {
				expirationDate: "asc",
			},
			take: 10,
			include: getContentInclude(opts.ctx.auth.sub),
		})

		return await fetchAndTransformToContentListItems(expiringContent, opts.ctx.auth.sub)
	}),
})
export default contentRouter
