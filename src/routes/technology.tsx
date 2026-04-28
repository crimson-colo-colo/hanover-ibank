import {
	Anchor,
	Box,
	Card,
	Divider,
	Group,
	Image,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/technology")({
	component: TechPage,
})

function TechPage() {
	return (
		<main>
			<header className="w-full p-4 text-white rounded-lg bg-primary">
				<Title>Technology</Title>
				<small className="mb-3 font-semibold tracking-wider text-gray-100 uppercase">
					Software tools, libraries, and frameworks that power this project
				</small>
			</header>
			<SimpleGrid cols={{ base: 2, sm: 4 }} mt="md">
				{pernStack.map((pernStack) => (
					<PernCard key={pernStack.category} {...pernStack} />
				))}
			</SimpleGrid>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mt="md">
				{technology.map((tech) => (
					<TechCard key={tech.category} {...tech} />
				))}
			</SimpleGrid>
		</main>
	)
}

const pernStack = [
	{
		category: "P",
		items: [
			{
				name: "PostgreSQL",
				description: "Database",
				url: "https://www.postgresql.org/",
				icon: "./src/assets/techIcons/postgresql.svg",
			},
		],
	},
	{
		category: "E",
		items: [
			{
				name: "Express",
				description: "Backend Framework",
				url: "https://expressjs.com/",
				icon: "./src/assets/techIcons/express.png",
			},
		],
	},
	{
		category: "R",
		items: [
			{
				name: "React",
				description: "UI Library",
				url: "https://react.dev/",
				icon: "./src/assets/techIcons/react.svg",
			},
		],
	},
	{
		category: "N",
		items: [
			{
				name: "Node.js",
				description: "Runtime",
				url: "https://nodejs.org/",
				icon: "./src/assets/techIcons/nodejs.svg",
			},
		],
	},
]
const technology = [
	{
		category: "Runtime & Package Manager",
		items: [
			{
				name: "Bun",
				version: "1.3.11",
				description: "All-in-one JavaScript runtime, bundler, and package manager.",
				url: "https://bun.sh/",
				icon: "./src/assets/techIcons/bun.svg",
			},
		],
	},
	{
		category: "Infrastructure & Environment",
		items: [
			{
				name: "Docker",
				version: "4.67.0",
				description: "Containerisation platform for consistent dev and production environments.",
				url: "https://www.docker.com/",
				icon: "./src/assets/techIcons/docker.svg",
			},
			{
				name: "Devcontainers",
				version: "js-node:0C1575",
				description: "Reproducible virtual developer environments via the devcontainers spec.",
				url: "https://containers.dev/",
				icon: "./src/assets/techIcons/devconatiners.svg",
			},
		],
	},
	{
		category: "Backend & API",
		items: [
			{
				name: "Express",
				version: "5.2.1",
				description: "Minimalist web framework for Node.js powering the HTTP API layer.",
				url: "https://expressjs.com/",
				icon: "./src/assets/techIcons/express.png",
			},
			{
				name: "tRPC",
				version: "11.16.0",
				description: "End-to-end typesafe APIs without schemas or code generation.",
				url: "https://trpc.io/",
				icon: "./src/assets/techIcons/trpc.svg",
			},
		],
	},
	{
		category: "Frontend & Routing",
		items: [
			{
				name: "TanStack",
				version: "1.168.22",
				description: "Routing, forms, and server-state querying — fully type-safe React utilities.",
				url: "https://tanstack.com/",
				icon: "./src/assets/techIcons/tanstack.png",
			},
		],
	},
	{
		category: "UI & Styling",
		items: [
			{
				name: "Mantine",
				version: "9.0.2",
				description:
					"Fully featured React component library with accessible, themeable components.",
				url: "https://mantine.dev/",
				icon: "./src/assets/techIcons/mantine.svg",
			},
			{
				name: "Tailwind CSS",
				version: "4.2.2",
				description: "Utility-first CSS framework for rapid, consistent UI development.",
				url: "https://tailwindcss.com/",
				icon: "./src/assets/techIcons/tailwindcss.svg",
			},
			{
				name: "Tabler Icons",
				version: "3.41.1",
				description: "Over 5,000 free MIT-licensed high-quality SVG icons for React.",
				url: "https://tabler.io/icons",
				icon: "./src/assets/techIcons/tabler-icons.svg",
			},
		],
	},
	{
		category: "Authentication",
		items: [
			{
				name: "Auth0",
				version: "5.6.0",
				description: "Managed user authentication and authorization as a service.",
				url: "https://auth0.com/",
				icon: "./src/assets/techIcons/auth0.svg",
			},
		],
	},
	{
		category: "Database & Storage",
		items: [
			{
				name: "PostgreSQL",
				version: "17.9",
				description: "Reliable, ACID-compliant relational database system.",
				url: "https://www.postgresql.org/",
				icon: "./src/assets/techIcons/postgresql.svg",
			},
			{
				name: "Prisma ORM",
				version: "7.7.0",
				description:
					"Next-gen TypeScript ORM with intuitive modelling and auto-generated migrations.",
				url: "https://www.prisma.io/",
				icon: "./src/assets/techIcons/prisma.svg",
			},
			{
				name: "MinIO S3",
				version: "8.0.7",
				description: "S3-compatible object storage for scalable file and media asset hosting.",
				url: "https://min.io/",
				icon: "./src/assets/techIcons/minio.svg",
			},
		],
	},
	{
		category: "Validation",
		items: [
			{
				name: "Zod",
				version: "4.3.6",
				description: "TypeScript-first schema declaration and validation library.",
				url: "https://zod.dev/",
				icon: "./src/assets/techIcons/zod.svg",
			},
		],
	},
	{
		category: "Linting & Formatting",
		items: [
			{
				name: "Biome",
				version: "2.4.6",
				description: "Fast all-in-one linter and formatter replacing ESLint and Prettier.",
				url: "https://biomejs.dev/",
				icon: "https://bestofjs.org/logos/biome.dark.svg",
			},
		],
	},
	{
		category: "Utilities",
		items: [
			{
				name: "Gotenberg",
				version: "8.30.1",
				description: "Docker-powered microservice that converts files and web pages into PDFs.",
				url: "https://gotenberg.dev/",
				icon: "https://gotenberg.dev/img/logo.png",
			},
			{
				name: "Faker.js",
				version: "10.4.0",
				description: "Generates realistic fake data for testing and seeding databases.",
				url: "https://fakerjs.dev/",
				icon: "https://fakerjs.dev/logo.svg",
			},
			{
				name: "Canvas",
				version: "3.2.3",
				description: "Node.js canvas API implementation used to draw and generate avatar icons.",
				url: "https://github.com/Automattic/node-canvas",
				icon: "https://upload.wikimedia.org/wikipedia/commons/d/db/Npm-logo.svg", // could not find icon
			},
			{
				name: "Open Graph Scraper",
				version: "6.11.0",
				description: "Fetches Open Graph metadata from URLs to generate rich link previews.",
				url: "https://github.com/jshemas/openGraphScraper",
				icon: "https://upload.wikimedia.org/wikipedia/commons/d/db/Npm-logo.svg",
			},
		],
	},
]

interface ToolItemProps {
	name: string
	description: string
	url: string
	icon?: string
	isLast: boolean
}
function ToolItem({ name, description, url, icon, isLast }: ToolItemProps) {
	return (
		<Box>
			<Group mb="xs">
				<Anchor href={url} target="_blank" fw={600}>
					{name}
				</Anchor>
				{icon && <Image mah={32} w="auto" maw={32} src={icon} />}
			</Group>
			<Text className="text-gray-700 dark:text-gray-400">{description}</Text>

			{!isLast && <Divider mt="md" />}
		</Box>
	)
}

function PernCard({
	category,
	items,
}: {
	category: string
	items: { name: string; description: string; url: string; icon: string }[]
}) {
	return (
		<Card withBorder className="hover:-translate-y-1.5 transition hover:shadow-sm">
			<Group justify="center" className="mb-md">
				<Text
					key={category}
					className="text-5xl font-black tracking-widest"
					style={{
						color: "transparent",
						WebkitTextStroke: "2px var(--fuchsia-700)",
						fontFamily: "inherit",
						letterSpacing: "0.15em",
					}}
				>
					{category}
				</Text>
			</Group>
			<Stack>
				{items.map((item, i) => (
					<ToolItem key={item.name} {...item} isLast={i === items.length - 1} />
				))}
			</Stack>
		</Card>
	)
}

function TechCard({
	category,
	items,
}: {
	category: string
	items: { name: string; description: string; url: string }[]
}) {
	return (
		<Card
			padding="md"
			withBorder
			h="100%"
			className="hover:-translate-y-1.5 transition hover:shadow-sm"
		>
			<Title order={4} mb="sm">
				{category}
			</Title>
			<Stack>
				{items.map((item, i) => (
					<ToolItem key={item.name} {...item} isLast={i === items.length - 1} />
				))}
			</Stack>
		</Card>
	)
}
