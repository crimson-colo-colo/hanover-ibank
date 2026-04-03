import { Button, Select, TextInput } from "@mantine/core"

export function InfoInputForm() {
	return (
		<form className="max-w-md mx-auto">
			<Select
				mt="sm"
				label="What is Your Role?"
				placeholder="Pick One"
				data={["Underwriter", "Business Analyst"]}
				clearable
			/>

			<TextInput mt="sm" label="First Name" placeholder="Input Name" />

			<TextInput mt="sm" label="Input Name" placeholder="Input Name" />

			<TextInput mt="sm" label="Input Email Adress" placeholder="Input Email Adress" />

			<Select
				mt="sm"
				label="What is the status of document you are uploading?"
				placeholder="Select One"
				data={["Complete", "Incomplete", "Under Review"]}
				clearable
			/>

			<Button mt="sm" variant="filled">
				Submit
			</Button>
		</form>
	)
}
