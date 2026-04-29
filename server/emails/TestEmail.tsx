import { CodeInline, Text } from "react-email"
import { Email, type EmailConfig } from "./Email.tsx"

export default function TestEmailPreview() {
	return (
		<TestEmail
			config={{
				assetOrigin: "http://localhost:3000",
				profileUrl: "http://localhost:3000/profile",
				supportUrl: "http://localhost:3000/support",
			}}
			userName="John Doe"
			userId="auth0|1234567890"
		/>
	)
}

export function TestEmail({
	config,
	userName,
	userId,
}: {
	config: EmailConfig
	userName: string
	userId: string
}) {
	return (
		<Email
			config={config}
			preview={`Hello ${userName}, this is a test email notification from iBank.`}
			heading={`A test email notification`}
			reason="You received this email because someone (probably you) triggered a test email notification from the iBank CLI."
		>
			<Text className="text-gray-700 mt-4">Hello {userName},</Text>
			<Text className="text-gray-700 mt-2">
				This is a test email notification sent from the iBank server. If you received this email, it
				means the email notification system is working correctly. You can trigger more test emails
				from the CLI with the command{" "}
				<CodeInline className="text-gray-900 font-semibold px-2 py-1 bg-gray-100 border border-gray-300 rounded">
					bun cli email send "{userId}"
				</CodeInline>
				.
			</Text>
		</Email>
	)
}
