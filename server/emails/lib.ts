export type Assets = (typeof Assets)[keyof typeof Assets]
export const Assets = {
	Logo: "/email-assets/logo.png",
} as const

export function assetUrl(appUrl: string, path: Assets) {
	return `${appUrl}${path}`
}
