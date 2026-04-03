import { Button, Select, TextInput } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/employee")({
	component: UploadContentForm,
})

function UploadContentForm() {
	return (
		<form className="max-w-md mx-auto">
			<Select
				mt="sm"
				label="Your Role"
				placeholder="Pick One"
				data={["Underwriter", "Business Analyst"]}
				clearable
			/>

			<TextInput mt="sm" label="Name" placeholder="Input Name" />

			<TextInput mt="sm" label="Email Adress" placeholder="Input Email Address" />

			<Button mt="sm" variant="filled">
				Submit
			</Button>
		</form>
	)
}
