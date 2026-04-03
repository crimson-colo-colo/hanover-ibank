import { Button, Select, TextInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"

export function InfoInputForm() {
	return (
		<form className="max-w-md mx-auto">
			<Select
				mt="sm"
				label="Your Role"
				placeholder="Pick One"
				data={["Underwriter", "Business Analyst"]}
				clearable
			/>

			<TextInput mt="sm" label="First Name" placeholder="Input First Name" />

			<TextInput mt="sm" label="Last Name" placeholder="Input Last Name" />

			<TextInput mt="sm" label="Email Adress" placeholder="Input Email Address" />

			<DatePickerInput mt="sm" label="Deadline" placeholder="Pick date" />

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
