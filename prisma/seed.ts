import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../server/generated/prisma/client.ts"

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
	console.log("🌱 Seeding database...")

	// TODO:
}

main()
	.catch((e) => {
		console.error("❌ Error seeding database:", e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
