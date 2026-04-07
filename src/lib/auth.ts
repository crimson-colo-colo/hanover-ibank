import type { Auth0ClientOptions } from "@auth0/auth0-spa-js"
import { env } from "@/env.ts"

/**
 * scopes is the set of permissions we request from Auth0. We need `openid
 * profile email` to get the user's identity, and `offline_access` to get a
 * refresh token so we can maintain the session without forcing the user to log
 * in constantly.
 */
export const scopes = "openid profile email offline_access"

export const authOptions = {
	authorizationParams: {
		redirect_uri: window.location.origin,
		audience: env.VITE_AUTH0_AUDIENCE,
		scope: scopes,
	},
	cacheLocation: "localstorage",
	clientId: env.VITE_AUTH0_CLIENT_ID,
	domain: env.VITE_AUTH0_DOMAIN,
	useRefreshTokens: true,
} as const satisfies Auth0ClientOptions
