import { FileType } from "@shared/filetype.ts"
import { Button, Text } from "react-email"
import { Email, type EmailConfig } from "./Email.tsx"

export default function ExpiringSoonEmailPreview() {
	return (
		<ExpiringSoonEmail
			config={{
				assetOrigin: "http://localhost:3000",
				profileUrl: "http://localhost:3000/profile",
				supportUrl: "http://localhost:3000/support",
			}}
			userName="John Doe"
			contentName="Project Plan.docx"
			fileType={FileType.WordDocument}
			action="http://localhost:3000/preview/abcd1234"
			expires="in 3 days"
		/>
	)
}

export function ExpiringSoonEmail({
	config,
	userName,
	contentName,
	fileType,
	action,
	expires,
}: {
	config: EmailConfig
	userName: string
	contentName: string
	fileType: FileType
	action: string
	expires: string
}) {
	return (
		<Email
			config={config}
			preview={`${contentName} is expiring soon. Review or update it to keep it in use.`}
			heading={`${contentName} is expiring soon`}
			reason="You received this email because you are subscribed to expiration notifications for your content in iBank."
		>
			<Text className="text-gray-700 mt-4">Hello {userName},</Text>
			{/* TODO: file type icon? */}
			<Text className="text-gray-700 mt-2">
				Your {fileType === FileType.Link ? "link" : "file"} <strong>{contentName}</strong> is set to
				expire {expires}. Please review or update it to keep it in use.
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
