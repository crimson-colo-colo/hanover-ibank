import type { Management, Page } from "auth0"
import { auth0Management } from "../auth.ts"

type User = Management.UserResponseSchema
type UserList = Page<User, Management.ListUsersOffsetPaginatedResponseContent>

class CachedAuth0Management {
	private userListCache: UserList | null = null
	private lastFetch = 0
	private ttl = 60000 // 1 minute

	/**
	 * Returns a cached list of users if available and not expired.
	 * If params are provided, it bypasses the cache.
	 */
	async listUsers(params?: Parameters<typeof auth0Management.users.list>[0]): Promise<UserList> {
		if (params && Object.keys(params).length > 0) {
			return auth0Management.users.list(params)
		}

		const now = Date.now()
		if (this.userListCache && now - this.lastFetch < this.ttl) {
			return this.userListCache
		}

		this.userListCache = await auth0Management.users.list()
		this.lastFetch = now
		return this.userListCache
	}

	/**
	 * Invalidates the user list cache.
	 */
	invalidate() {
		this.userListCache = null
		this.lastFetch = 0
	}
}

export const auth0Cache = new CachedAuth0Management()
