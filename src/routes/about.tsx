import {
	Card,
	Grid,
	Image,
	Text,
	Title,
	useMantineColorScheme,
	useMantineTheme,
} from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import brandonPhoto from "../assets/teamphotos/brandon.png"
import calebPhoto from "../assets/teamphotos/caleb.png"
import elijahPhoto from "../assets/teamphotos/elijah.png"
import everettPhoto from "../assets/teamphotos/everett.png"
import jacePhoto from "../assets/teamphotos/jace.png"
import josePhoto from "../assets/teamphotos/jose.jpg"
import josuePhoto from "../assets/teamphotos/josue.png"
import julienPhoto from "../assets/teamphotos/julien.png"
import justinPhoto from "../assets/teamphotos/justin.png"
import lucasPhoto from "../assets/teamphotos/lucas.png"
import philPhoto from "../assets/teamphotos/phil.png"
import wwong2Photo from "../assets/teamphotos/wwong2.jpg"

export const Route = createFileRoute("/about")({
	component: AboutPage,
})

interface TeamMember {
	name: string
	role: string
	photo: string
	alt: string
	quote: string
}

const rows: TeamMember[][] = [
	[
		{
			name: "Prof. Wilson Wong",
			role: "Software Engineering Professor",
			photo: wwong2Photo,
			alt: "Wong",
			quote: "Placeholder Quote",
		},
		{
			name: "Jose Manuel Perez Jimenez",
			role: "Team Coach",
			photo: josePhoto,
			alt: "Jose",
			quote: "Placeholder Quote",
		},
	],
	[
		{
			name: "Caleb Chan",
			role: "Lead Software Engineer",
			photo: calebPhoto,
			alt: "Caleb",
			quote: "Placeholder Quote",
		},
		{
			name: "Everett Wilber",
			role: "Assistant Lead Software Engineer",
			photo: everettPhoto,
			alt: "Everett",
			quote: "Placeholder Quote",
		},
		{
			name: "Phil Banoub",
			role: "Assistant Lead Software Engineer",
			photo: philPhoto,
			alt: "Phil",
			quote: "Placeholder Quote",
		},
	],
	[
		{
			name: "Josue Hernandez",
			role: "Full Time Software Engineer",
			photo: josuePhoto,
			alt: "Josue",
			quote: "Placeholder Quote",
		},
		{
			name: "Brandon Gainey",
			role: "Full Time Software Engineer",
			photo: brandonPhoto,
			alt: "Brandon",
			quote: "Placeholder Quote",
		},
		{
			name: "Lucas Zaki",
			role: "Full Time Software Engineer",
			photo: lucasPhoto,
			alt: "Lucas",
			quote: "Placeholder Quote",
		},
	],
	[
		{
			name: "Justin Fletcher",
			role: "Project Manager",
			photo: justinPhoto,
			alt: "Justin",
			quote: "Placeholder Quote",
		},
		{
			name: "Julien Polycarpe",
			role: "Product Owner",
			photo: julienPhoto,
			alt: "Julien",
			quote: "Placeholder Quote",
		},
		{
			name: "Jace Bonjorno",
			role: "Documentation Analyst",
			photo: jacePhoto,
			alt: "Jace",
			quote: "Placeholder Quote",
		},
		{
			name: "Elijah King",
			role: "Scrum Master",
			photo: elijahPhoto,
			alt: "Elijah",
			quote: "Placeholder Quote",
		},
	],
]

function TeamCard({ name, role, photo, alt, quote }: TeamMember) {
	const [hovered, setHovered] = useState(false)
	const [showQuote, setShowQuote] = useState(false)
	const { colorScheme } = useMantineColorScheme()
	const theme = useMantineTheme()

	const isDark = colorScheme === "dark"
	const bubbleBg = isDark ? theme.colors.dark[5] : "white"
	const bubbleBorder = isDark ? theme.colors.dark[4] : "#dee2e6"
	const bubbleText = isDark ? theme.colors.dark[0] : "#495057"

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
			<div style={{ position: "relative", flexShrink: 0 }}>
				<Image
					src={photo}
					alt={alt}
					w={120}
					h="auto"
					fit="cover"
					style={{ flexShrink: 0, borderRadius: 60, cursor: "pointer" }}
					onClick={() => setShowQuote((v) => !v)}
				/>

				{showQuote && (
					<div
						style={{
							position: "absolute",
							top: "80%",
							left: "calc(100% + 14px)",
							transform: "translateY(-50%)",
							background: bubbleBg,
							border: `1px solid ${bubbleBorder}`,
							borderRadius: 8,
							padding: "8px 12px",
							width: 180,
							boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
							zIndex: 100,
							fontSize: 13,
							color: bubbleText,
							fontStyle: "italic",
						}}
					>
						<div
							style={{
								position: "absolute",
								top: "50%",
								left: -8,
								transform: "translateY(-50%)",
								width: 0,
								height: 0,
								borderTop: "8px solid transparent",
								borderBottom: "8px solid transparent",
								borderRight: `8px solid ${bubbleBg}`,
								filter: `drop-shadow(-1px 0 0 ${bubbleBorder})`,
							}}
						/>
						"{quote}"
					</div>
				)}
			</div>
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
