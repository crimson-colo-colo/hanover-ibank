import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../server/generated/prisma/client.ts"

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

main()
	.catch((e) => {
		console.error("❌ Error seeding database:", e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

async function main() {
	await prisma.$connect()

	const [users, content] = await Promise.all([prisma.user.count(), prisma.content.count()])
	if (users > 0 || content > 0) {
		process.stdout.write(
			`⚠️ \x1b[33mDatabase already has data (users: ${users}, content: ${content}. Continuing will erase existing data and cannot be undone. Really continue[y/N] \x1b[0m`
		)
		const answer = await new Promise<string>((resolve) => {
			process.stdin.setEncoding("utf-8")
			process.stdin.once("data", (data) =>
				resolve(
					(typeof data === "string" ? data : new TextDecoder().decode(data)).trim().toLowerCase()
				)
			)
		})
		if (answer !== "y" && answer !== "yes") {
			console.log("Aborting.")
			return
		}
	}

	console.log("🌱 Seeding database...")

	await prisma.$transaction([prisma.user.deleteMany(), prisma.content.deleteMany()])
}
