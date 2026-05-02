import type { HeadObjectOutput } from "@aws-sdk/client-s3"
import type { Management } from "auth0"
import type { ContentListItem } from "../../shared/types.ts"
import type { Prisma, UserAction } from "../generated/prisma/client.ts"
import { bucketName, s3 } from "../s3.ts"
import { auth0Cache } from "./auth0.ts"
import { db } from "../database.ts"

export const getContentInclude = (userId: string) =>
	({
		owner: true,
		checkedOutBy: true,
		favoritedBy: {
			where: {
				employeeId: userId,
			},
		},
		tags: true,
		recentTimestamps: {
			where: {
				employeeId: userId,
			},
		},
	}) as const satisfies Prisma.ContentInclude

export type ContentWithIncludes = Prisma.ContentGetPayload<{
	include: ReturnType<typeof getContentInclude>
}>

export async function getS3Metadata(data: { id: string; type: string; objectId: string | null }[]) {
	const metadata = new Map<string, HeadObjectOutput>()
	await Promise.all(
		data
			.filter((content) => content.type === "Object")
			.map(async (content) => {
				try {
					const head = await s3.headObject({ Bucket: bucketName, Key: content.objectId! })
					metadata.set(content.id, head)
				} catch (e) {
					console.error(`Failed to fetch S3 metadata for content ${content.id}:`, e)
				}
			})
	)
	return metadata
}

export function transformToContentListItem(
	content: ContentWithIncludes,
	users: Management.UserResponseSchema[], // Auth0 users
	metadata: Map<string, HeadObjectOutput>,
	userId: string
): ContentListItem {
	const unknownUser = {
		name: "Unknown User",
		email: "unknown",
		username: "unknown",
		avatarUrl: "",
		nickname: null,
		picture: null,
	}
	const owner = users.find((u) => u.user_id === content.ownerId) ?? unknownUser
	const checkedOutByUser = content.checkedOutBy
		? (users.find((u) => u.user_id === content.checkedOutById) ?? unknownUser)
		: null

	const common = {
		id: content.id,
		title: content.title,
		ownerId: content.ownerId,
		lastModifiedDate: content.lastModifiedDate,
		expirationDate: content.expirationDate,
		status: content.status,
		favorited: content.favoritedBy.length > 0,
		recentTimestamps: content.recentTimestamps.map((timestamp) => ({
			recentlyViewed: timestamp.recentlyViewed,
			recentlyEdited: timestamp.recentlyEdited,
			employeeId: userId,
		})),
		owner: {
			id: content.ownerId,
			name: owner.name ?? owner.nickname ?? owner.username!,
			email: owner.email!,
			username: owner.username!,
			role: content.owner.role,
		},
		checkedOutBy: checkedOutByUser
			? {
					id: content.checkedOutById!,
					name: checkedOutByUser.name ?? checkedOutByUser.nickname ?? checkedOutByUser.username!,
					email: checkedOutByUser.email!,
					username: checkedOutByUser.username!,
					role: content.checkedOutBy!.role,
				}
			: null,
		tags: content.tags.map((tag) => ({
			category: tag.tagCategory,
			name: tag.tagName,
		})),
	}

	if (content.type === "Object") {
		return {
			...common,
			type: "Object",
			objectId: content.objectId!,
			object: metadata.get(content.id)!,
		} as ContentListItem
	}
	return {
		...common,
		type: "Link",
		url: content.url!,
	} as ContentListItem
}

export async function fetchAndTransformToContentListItems(
	data: ContentWithIncludes[],
	userId: string
): Promise<ContentListItem[]> {
	const [users, metadata] = await Promise.all([auth0Cache.listUsers(), getS3Metadata(data)])
	return data.map((item) => transformToContentListItem(item, users.data, metadata, userId))
}

export async function logActivity(
	employeeId: string,
	action: UserAction,
	contentId?: string)
{
	await db.activityLog.create({
		data: {
			employeeId,
			action,
			contentId,
		},
	})
}
