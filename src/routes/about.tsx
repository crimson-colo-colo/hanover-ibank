import { Card, Grid, Image, Text, Title } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/about")({
	component: AboutPage,
})

interface TeamMember {
	name: string
	role: string
	photo: string
	alt: string
}

const rows: TeamMember[][] = [
	[
		{
			name: "Prof. Wilson Wong",
			role: "Software Engineering Professor",
			photo: "src/assets/teamphotos/wwong2.jpg",
			alt: "Wong",
		},
		{
			name: "Jose Manuel Perez Jimenez",
			role: "Team Coach",
			photo: "src/assets/teamphotos/jose.jpg",
			alt: "Jose",
		},
	],
	[
		{
			name: "Caleb Chan",
			role: "Lead Software Engineer",
			photo: "src/assets/teamphotos/caleb.png",
			alt: "Caleb",
		},
		{
			name: "Everett Wilber",
			role: "Assistant Lead Software Engineer",
			photo: "src/assets/teamphotos/everett.png",
			alt: "Everett",
		},
		{
			name: "Phil Banoub",
			role: "Assistant Lead Software Engineer",
			photo: "src/assets/teamphotos/phil.png",
			alt: "Phil",
		},
	],
	[
		{
			name: "Josue Hernandez",
			role: "Full Time Software Engineer",
			photo: "src/assets/teamphotos/josue.png",
			alt: "Josue",
		},
		{
			name: "Brandon Gainey",
			role: "Full Time Software Engineer",
			photo: "src/assets/teamphotos/brandon.png",
			alt: "Brandon",
		},
		{
			name: "Lucas Zaki",
			role: "Full Time Software Engineer",
			photo: "src/assets/teamphotos/lucas.png",
			alt: "Lucas",
		},
	],
	[
		{
			name: "Justin Fletcher",
			role: "Project Manager",
			photo: "src/assets/teamphotos/justin.png",
			alt: "Justin",
		},
		{
			name: "Julien Polycarpe",
			role: "Product Owner",
			photo: "src/assets/teamphotos/julien.png",
			alt: "Julien",
		},
		{
			name: "Jace Bonjorno",
			role: "Documentation Analyst",
			photo: "src/assets/teamphotos/jace.png",
			alt: "Jace",
		},
		{
			name: "Elijah King",
			role: "Scrum Master",
			photo: "src/assets/teamphotos/elijah.png",
			alt: "Elijah",
		},
	],
]

function TeamCard({ name, role, photo, alt }: TeamMember) {
	const [hovered, setHovered] = useState(false)

	return (
		<Card
			padding="sm"
			withBorder
			h="100%"
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				display: "flex",
				flexDirection: "row",
				transition: "transform 0.2s ease, box-shadow 0.2s ease",
				transform: hovered ? "translateY(-6px)" : "translateY(0)",
				boxShadow: hovered ? "0 8px 24px rgba(0, 0, 0, 0.12)" : undefined,
			}}
		>
			<Image
				src={photo}
				alt={alt}
				w={120}
				h="auto"
				fit="cover"
				style={{ flexShrink: 0, borderRadius: 4 }}
			/>
			<div
				style={{
					padding: "0 12px",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
				}}
			>
				<Title fz="xl">{name}</Title>
				<small className="mb-3 font-semibold tracking-wider text-gray-400 uppercase">{role}</small>
			</div>
		</Card>
	)
}

function AboutPage() {
	return (
		<main>
			<header className="w-full p-4 text-white rounded-lg bg-primary">
				<Title>About This Project</Title>
				<small className="mb-3 font-semibold tracking-wider text-gray-200 uppercase">
					WPI Computer Science Department - CS3733-D26 Software Engineering
				</small>
			</header>

			{rows.map((row, rowIndex) => (
				<Grid mt="md" gap="md" key={row[0].name}>
					{row.map((member) => (
						<Grid.Col span={12 / row.length} key={member.name}>
							<TeamCard {...member} />
						</Grid.Col>
					))}
				</Grid>
			))}

			<Grid mt="md" gap="md">
				<Grid.Col span={12}>
					<Card padding="sm" withBorder>
						<Title fz="xl">Special Thanks To:</Title>
						<br />
						<Text className="mb-0 font-semibold tracking-wider text-gray-400">
							Hanover Insurance
						</Text>
						<br />
						<Text className="mb-0 font-semibold tracking-wider text-gray-400">
							Brandon Roche, Deputy CIO
						</Text>
						<br />
						<Text className="mb-0 font-semibold tracking-wider text-gray-400">
							Meaghan Jenket, Principle Business Architect
						</Text>
					</Card>
				</Grid.Col>
			</Grid>
		</main>
	)
}
