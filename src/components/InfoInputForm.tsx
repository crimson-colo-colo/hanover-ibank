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
			/>

			<TextInput mt="sm" label="First Name" placeholder="Input First Name" />

			<TextInput mt="sm" label="Last Name" placeholder="Input Last Name" />

			<TextInput mt="sm" label="Email Adress" placeholder="Input Email Adress" />

			<DatePickerInput mt="sm" label="Deadline" placeholder="Pick date" />

			<Button mt="md" variant="filled">
				Submit
			</Button>
		</form>
	)
}
