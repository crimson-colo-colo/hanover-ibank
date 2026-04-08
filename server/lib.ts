import crypto from "node:crypto"

export function getGravatarUrl(email: string) {
	const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex")
	return `https://www.gravatar.com/avatar/${hash}?d=identicon`
}

export function isoDateToTimestamp(date: string) {
	return `${date}T00:00:00Z`
}
