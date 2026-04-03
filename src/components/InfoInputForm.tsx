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

			<TextInput mt="sm" label="Name" placeholder="Input Name" />

			<TextInput mt="sm" label="Owner First Name" placeholder="Input Owner First Name" />

			<TextInput mt="sm" label="Owner Email Adress" placeholder="Input Owner Email Address" />

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
