import { ApiClient } from "@auth0/auth0-api-js"
import { ManagementClient } from "auth0"
import { auth } from "express-oauth2-jwt-bearer"
import { env } from "./env.ts"

const authorizationMiddleware = auth({
	issuerBaseURL: `https://${env.VITE_AUTH0_DOMAIN}`,
	audience: env.VITE_AUTH0_AUDIENCE,
	authRequired: false,
})

export default authorizationMiddleware

export const auth0Api = new ApiClient({
	domain: env.VITE_AUTH0_DOMAIN,
	audience: env.VITE_AUTH0_AUDIENCE,
})

export interface JWTPayload {
	sub: string
}

export const auth0Management = new ManagementClient({
	domain: env.AUTH0_TENANT,
	clientId: env.AUTH0_MANAGEMENT_CLIENT_ID,
	clientSecret: env.AUTH0_MANAGEMENT_CLIENT_SECRET,
	withCustomDomainHeader: env.VITE_AUTH0_DOMAIN,
})
