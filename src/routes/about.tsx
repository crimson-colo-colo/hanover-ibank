import { Card, Flex, HoverCard, Image, SimpleGrid, Text, Title } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import clsx from "clsx"
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
	quote?: string
}

const cards: TeamMember[] = [
	{
		name: "Prof. Wilson Wong",
		role: "Software Engineering Professor",
		photo: wwong2Photo,
		alt: "Wong",
	},
	{
		name: "Jose Manuel Perez Jimenez",
		role: "Team Coach",
		photo: josePhoto,
		alt: "Jose",
	},
	{
		name: "Caleb Chan",
		role: "Lead Software Engineer",
		photo: calebPhoto,
		alt: "Caleb",
		quote: "You're telling me a shrimp fried this rice?",
	},
	{
		name: "Justin Fletcher",
		role: "Project Manager",
		photo: justinPhoto,
		alt: "Justin",
		quote:
			"If we back up the capacitor, we can get to the TLS driver through the primary USB sensor!",
	},
	{
		name: "Phil Banoub",
		role: "Assistant Lead Software Engineer",
		photo: philPhoto,
		alt: "Phil",
		quote: "Believe you can and you're halfway there.",
	},
	{
		name: "Everett Wilber",
		role: "Assistant Lead Software Engineer",
		photo: everettPhoto,
		alt: "Everett",
		quote: "Build your own dreams, or someone else will hire you to build theirs.",
	},
	{
		name: "Josue Hernandez",
		role: "Full Time Software Engineer",
		photo: josuePhoto,
		alt: "Josue",
		quote: "Keep it pushing, the only moment you fail is when you give up.",
	},
	{
		name: "Brandon Gainey",
		role: "Full Time Software Engineer",
		photo: brandonPhoto,
		alt: "Brandon",
		quote: "It is never too late to be what you might have been.",
	},
	{
		name: "Lucas Zaki",
		role: "Full Time Software Engineer",
		photo: lucasPhoto,
		alt: "Lucas",
		quote: "Life shrinks or expands in proportion to one's courage.",
	},
	{
		name: "Julien Polycarpe",
		role: "Product Owner",
		photo: julienPhoto,
		alt: "Julien",
		quote: "Either you run the day, or the day runs you.",
	},
	{
		name: "Jace Bonjorno",
		role: "Documentation Analyst",
		photo: jacePhoto,
		alt: "Jace",
		quote: "Winning isn't everything, but wanting to win is.",
	},
	{
		name: "Elijah King",
		role: "Scrum Master",
		photo: elijahPhoto,
		alt: "Elijah",
		quote: "If you're offered a seat on a rocket ship, don't ask what seat! Just get on.",
	},
]

function TeamCard({ name, role, photo, alt, quote }: TeamMember) {
	return (
		<Card
			padding="sm"
			withBorder
			h="100%"
			className="hover:-translate-y-1.5 hover:shadow-lg transition flex flex-row"
		>
			<HoverCard withArrow arrowSize={10} position="right" shadow="sm" disabled={!quote}>
				<HoverCard.Target>
					<Image
						src={photo}
						alt={alt}
						w={120}
						h={120}
						fit="cover"
						className={clsx("shrink-0 rounded-full", quote && "cursor-pointer")}
					/>
				</HoverCard.Target>
				<HoverCard.Dropdown maw="300">&ldquo;{quote}&rdquo;</HoverCard.Dropdown>
			</HoverCard>

			<div className="px-3 flex flex-col justify-center min-w-0 flex-1">
				<Title className="text-2xl">{name}</Title>
				<span className="mb-3 font-semibold tracking-wider text-gray-400 uppercase">{role}</span>
			</div>
		</Card>
	)
}

function AboutPage() {
	return (
		<main>
			<header className="w-full p-4 text-white rounded-lg bg-primary dark:bg-fuchsia-800">
				<Title>About This Project</Title>
				<small className="mb-3 font-semibold tracking-wider text-gray-200 uppercase">
					WPI Computer Science Department - CS3733-D26 Software Engineering
				</small>
			</header>

			<SimpleGrid maw="1200" mx="auto" minColWidth={400} mt="md">
				{cards.map((member) => (
					<TeamCard key={member.name} {...member} />
				))}
			</SimpleGrid>

			<Card padding="sm" mt="md" withBorder maw="1200" mx="auto">
				<Title fz="xl">Special Thanks</Title>
				<Flex gap="4" mt="sm" direction="column">
					<Text fw="700">Hanover Insurance</Text>
					<Text className="ml-md">Brandon Roche, Deputy CIO</Text>
					<Text className="ml-md">Meaghan Jenket, Principle Business Architect</Text>
				</Flex>
			</Card>
		</main>
	)
}
