import { ApiClient } from "@auth0/auth0-api-js"
import { auth } from "express-oauth2-jwt-bearer"
import { env } from "./env.ts"

const authorizationMiddlelayer = auth({
	issuerBaseURL: `https://${env.VITE_AUTH0_DOMAIN}`,
	audience: env.VITE_AUTH0_AUDIENCE,
	authRequired: false,
})

export default authorizationMiddlelayer

export const auth0Api = new ApiClient({
	domain: env.VITE_AUTH0_DOMAIN,
	audience: env.VITE_AUTH0_AUDIENCE,
})

export interface JWTPayload {
	sub: string
}
