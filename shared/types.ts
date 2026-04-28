import type { HeadObjectCommandOutput, HeadObjectOutput } from "@aws-sdk/client-s3"
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query"
import type { TRPCClientErrorLike } from "@trpc/client"
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server"
import type { Prisma } from "../server/generated/prisma/browser.ts"
import type {
	ContentStatus,
	ContentType,
	EmployeeRole,
	TagCategory,
} from "../server/generated/prisma/enums.ts"
import type { AppRouter } from "../server/router.ts"

export type User = {
	id: string
	name: string
	email: string
	username: string
	role: EmployeeRole
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
	recentTimestamps: {
		recentlyViewed: Date
		recentlyEdited: Date
		employeeId: string
	}[]
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

type RouterOutput = inferRouterOutputs<AppRouter>
type RouterInput = inferRouterInputs<AppRouter>
type CheckInOutput = RouterOutput["content"]["checkIn"]
type CheckInInput = RouterInput["content"]["checkIn"]
export type CheckInMutationType = UseMutationResult<
	CheckInOutput,
	TRPCClientErrorLike<AppRouter>,
	CheckInInput
>
type CheckOutOutput = RouterOutput["content"]["checkOut"]
type CheckOutInput = RouterInput["content"]["checkOut"]
export type CheckOutMutationType = UseMutationResult<
	CheckOutOutput,
	TRPCClientErrorLike<AppRouter>,
	CheckOutInput
>

type ViewTotals =
	| {
			title: string | undefined
			contentId: string
			_sum: {
				viewCount: number | null
			}
			metadata: HeadObjectCommandOutput | undefined
	  }[]
	| undefined

export type ListFavoritesQuery = UseQueryResult<ContentList, TRPCClientErrorLike<AppRouter>>
export type ViewTotalsQuery = UseQueryResult<ViewTotals, TRPCClientErrorLike<AppRouter>>

export type Profile = {
	id: string
	name: string
	email: string
	username: string
	role: EmployeeRole | undefined
}

export type Thread = Prisma.ContentTalkThreadGetPayload<{
	include: {
		createdBy: true
		resolvedBy: true
		comments: {
			orderBy: {
				updatedAt: "asc"
			}
			include: {
				author: true
			}
		}
	}
}>
