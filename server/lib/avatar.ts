import { colors } from "@shared/colors.ts"
import fnv1a from "@sindresorhus/fnv1a"
import { createCanvas, registerFont } from "canvas"

const avatarColors: Record<string, readonly string[]> = structuredClone(colors)
delete avatarColors.gray

export function generateDefaultAvatar(name: string) {
	const initials = name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.slice(0, 3)
	const canvas = createCanvas(120, 120)
	const ctx = canvas.getContext("2d")
	const hash = Number(fnv1a(name))
	const colorKey = Object.keys(avatarColors)[hash % Object.keys(avatarColors).length]
	ctx.fillStyle = avatarColors[colorKey][7]
	ctx.fillRect(0, 0, 120, 120)
	ctx.fillStyle = "white"
	ctx.textAlign = "center"
	ctx.textBaseline = "middle"
	registerFont("server/assets/miranda-sans-latin-400-normal.ttf", { family: "Miranda Sans" })
	ctx.font = "45px 'Miranda Sans'"
	ctx.fillText(initials, 60, 60)
	return canvas.toBuffer()
}
