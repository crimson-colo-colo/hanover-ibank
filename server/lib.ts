import crypto from "node:crypto"

export function getGravatarUrl(email: string) {
	const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex")
	return `https://www.gravatar.com/avatar/${hash}?d=identicon`
}
