import { colors } from "@shared/colors.ts"
import {
	Body,
	Container,
	Font,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	pixelBasedPreset,
	Section,
	Tailwind,
	Text,
} from "react-email"
import { Assets, assetUrl } from "./lib.ts"

const shadeName = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"] as const

export interface EmailConfig {
	assetOrigin: string
	profileUrl: string
	supportUrl: string
}

export function Email({
	config,
	preview,
	heading,
	reason,
	children,
}: {
	config: EmailConfig
	preview: React.ComponentProps<typeof Preview>["children"]
	heading: React.ReactNode
	reason: string
	children: React.ReactNode
}) {
	return (
		<Tailwind
			config={{
				presets: [pixelBasedPreset],
				theme: {
					colors: {
						white: "#ffffff",
						black: "#000000",
						transparent: "transparent",
						...Object.fromEntries(
							Object.entries(colors).map(([key, value]) => [
								key,
								Object.fromEntries(value.map((v, i) => [shadeName[i], v] as const)),
							])
						),
					},
				},
			}}
		>
			<Html>
				<Head>
					<Preview>{preview}</Preview>
					<Font
						fontFamily="Miranda Sans"
						fallbackFontFamily="sans-serif"
						webFont={{
							url: "https://fonts.gstatic.com/s/mirandasans/v3/aFTT7Pt8ZWk4XsiWhk7Rb_edb435.woff2",
							format: "woff2",
						}}
						fontWeight="400 700"
						fontStyle="normal"
					/>
				</Head>
				<Body>
					<Container>
						<Section>
							<Img
								src={assetUrl(config.assetOrigin, Assets.Logo)}
								width={64}
								height={64}
								alt="Logo"
								className="mt-8"
							/>
							<Heading className="text-2xl font-bold mt-4">{heading}</Heading>
						</Section>
						<Hr />
						<Section>{children}</Section>
						<Hr />
						<Section className="text-gray-500 text-sm">
							<Text className="mt-2">
								{reason} Manage your notification preferences in your{" "}
								<Link href={config.profileUrl} className="text-fuchsia-600">
									account settings
								</Link>
								.
							</Text>
							<Text className="mt-2">
								Questions? Contact our support team{" "}
								<Link href={config.supportUrl} className="text-fuchsia-600">
									online
								</Link>
								.
							</Text>
							<Text className="mt-2">
								Copyright &copy; {new Date().getFullYear()} iBank. All rights reserved.
								<br />
								1234 Main St, Anytown, USA 56789
							</Text>
							<Text className="mt-2">
								Disclaimer: iBank is a class project for WPI's CS 3733 Software Engineering course
								and is not a real product in use by Hanover Insurance. This email is not an official
								communication from any company.
							</Text>
						</Section>
					</Container>
				</Body>
			</Html>
		</Tailwind>
	)
}
