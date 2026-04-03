import { Button, Select, TextInput } from "@mantine/core"

export function InfoInputForm() {
	return (
		<form>
			<Select
				mt="sm"
				label="What is Your Role?"
				placeholder="Pick One"
				data={["Underwriter", "Business Analyst"]}
			/>

			<TextInput mt="sm" label="First Name" placeholder="Input Name" />

			<TextInput mt="sm" label="Input Name" placeholder="Input Name" />

			<TextInput mt="sm" label="Input Email Adress" placeholder="Input Email Adress" />

			<Button mt="sm" variant="filled">
				Submit
			</Button>
		</form>
	)
}
