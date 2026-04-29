import { Button, Text } from "react-email"
import { Email, type EmailConfig } from "./Email.tsx"

export default function ContentCheckedInEmailPreview() {
	return (
		<ContentCheckedInEmail
			config={{
				assetOrigin: "http://localhost:3000",
				profileUrl: "http://localhost:3000/profile",
				supportUrl: "http://localhost:3000/support",
			}}
			userName="John Doe"
			actorName="Jane Smith"
			contentName="Project Plan.docx"
			action="http://localhost:3000/preview/abcd1234"
		/>
	)
}

export function ContentCheckedInEmail({
	config,
	userName,
	contentName,
	actorName,
	action,
}: {
	config: EmailConfig
	userName: string
	contentName: string
	actorName: string
	action: string
}) {
	return (
		<Email
			config={config}
			preview={`${actorName} checked in ${contentName}`}
			heading={`${contentName} has been checked in`}
			reason="You received this email because you are subscribed to email notifications for your content in iBank."
		>
			<Text className="text-gray-700 mt-4">Hello {userName},</Text>
			{/* TODO: file type icon? */}
			<Text className="text-gray-700 mt-2">
				{actorName} has checked in {contentName}. You can now view and edit this content in iBank.
				Please review it and make any necessary updates.
			</Text>
			<Button
				href={action}
				className="bg-fuchsia-600 text-white px-6 py-3 rounded-md font-semibold mb-5"
			>
				Go to iBank
			</Button>
		</Email>
	)
}
