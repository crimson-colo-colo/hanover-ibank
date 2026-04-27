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
import { useState } from "react"

export const Route = createFileRoute("/technology")({
	component: TechPage,
})

const pernStack = [
	{
		category: "P",
		items: [
			{
				name: "PostgreSQL",
				description: "Database",
				url: "https://www.postgresql.org/",
				icon: "https://wiki.postgresql.org/images/a/a4/PostgreSQL_logo.3colors.svg",
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
				icon: "https://img.icons8.com/?size=100&id=kg46nzoJrmTR&format=png&color=000000",
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
				icon: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
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
				icon: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg",
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
				icon: "./src/assets/techIcons/bunIcon.svg",
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
				icon: "./src/assets/techIcons/docker-mark-ocean-blue.svg",
			},
			{
				name: "Devcontainer",
				version: "js-node:0C1575",
				description: "Reproducible virtual developer environments via the devcontainers spec.",
				url: "https://containers.dev/",
				icon: "src/assets/techIcons/Development Containers.svg",
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
				icon: "https://img.icons8.com/?size=100&id=kg46nzoJrmTR&format=png&color=000000",
			},
			{
				name: "tRPC",
				version: "11.16.0",
				description: "End-to-end typesafe APIs without schemas or code generation.",
				url: "https://trpc.io/",
				icon: "https://trpc.io/img/logo.svg",
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
				icon: "https://tanstack.com/images/logos/logo-color-banner-600.png",
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
				icon: "./src/assets/techIcons/mantine-logo.svg",
			},
			{
				name: "Tailwind CSS",
				version: "4.2.2",
				description: "Utility-first CSS framework for rapid, consistent UI development.",
				url: "https://tailwindcss.com/",
				icon: "src/assets/techIcons/tailwindcss-mark.96ee6a5a.svg",
			},
			{
				name: "Tabler Icons",
				version: "3.41.1",
				description: "Over 5,000 free MIT-licensed high-quality SVG icons for React.",
				url: "https://tabler.io/icons",
				icon: "src/assets/techIcons/brand-tabler.svg",
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
				icon: "https://wiki.postgresql.org/images/a/a4/PostgreSQL_logo.3colors.svg",
			},
			{
				name: "Prisma ORM",
				version: "7.7.0",
				description:
					"Next-gen TypeScript ORM with intuitive modelling and auto-generated migrations.",
				url: "https://www.prisma.io/",
				icon: "./src/assets/techIcons/prisma-svgrepo-com.svg",
			},
			{
				name: "MinIO S3",
				version: "8.0.7",
				description: "S3-compatible object storage for scalable file and media asset hosting.",
				url: "https://min.io/",
				icon: "./src/assets/techIcons/MinIO-Logo-Color.svg",
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
				icon: "./src/assets/techIcons/Zod Symbol SVG.svg",
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
			<Group>
				<Anchor href={url} target="_blank">
					{name}
				</Anchor>
				{icon && <Image w={40} src={icon} />}
			</Group>
			<Text>{description}</Text>

			{!isLast && <Divider />}
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
	const [hovered, setHovered] = useState(false)
	return (
		<Card
			mt="md"
			withBorder
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				transition: "transform 0.2s ease, box-shadow 0.2s ease",
				transform: hovered ? "translateY(-6px)" : "translateY(0)",
				boxShadow: hovered ? "0 8px 24px rgba(0, 0, 0, 0.12)" : undefined,
			}}
		>
			<Group justify="center">
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
	const [hovered, setHovered] = useState(false)
	return (
		<Card
			padding="sm"
			mt="md"
			withBorder
			h="100%"
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				transition: "transform 0.2s ease, box-shadow 0.2s ease",
				transform: hovered ? "translateY(-6px)" : "translateY(0)",
				boxShadow: hovered ? "0 8px 24px rgba(0, 0, 0, 0.12)" : undefined,
			}}
		>
			<Text>{category}</Text>
			<Stack>
				{items.map((item, i) => (
					<ToolItem key={item.name} {...item} isLast={i === items.length - 1} />
				))}
			</Stack>
		</Card>
	)
}

function TechPage() {
	return (
		<main>
			<header className="w-full p-4 text-white rounded-lg bg-primary">
				<Title>Technology</Title>
				<small className="mb-3 font-semibold tracking-wider text-gray-200 uppercase">
					Software tools, software libraries, and frameworks that this application has incorporated.
				</small>
			</header>
			<SimpleGrid cols={{ base: 2, sm: 4 }}>
				{pernStack.map((pernStack) => (
					<PernCard key={pernStack.category} {...pernStack} />
				))}
			</SimpleGrid>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
				{technology.map((tech) => (
					<TechCard key={tech.category} {...tech} />
				))}
			</SimpleGrid>
		</main>
	)
}
