import { Button, Select, TextInput } from "@mantine/core"
import { schemaResolver, useForm } from "@mantine/form"
import { EmployeeRole } from "@prisma/browser.ts"
import { createFileRoute } from "@tanstack/react-router"
import z from "zod"
import { employeeRoleDisplayName } from "@/lib/enums.ts"

export const Route = createFileRoute("/_authenticated/employee")({
	component: UploadContentForm,
})

const schema = z.object({
	role: z.enum(Object.values(EmployeeRole)),
	name: z.string(),
	email: z.email(),
})

function UploadContentForm() {
	const form = useForm<z.infer<typeof schema>>({
		validate: schemaResolver(schema, { sync: true }),
	})

	function onSubmit(values: z.infer<typeof schema>) {
		console.log(values)
	}

	return (
		<form className="max-w-md mx-auto" onSubmit={form.onSubmit(onSubmit)}>
			<Select
				mt="sm"
				label="Your Role"
				placeholder="Pick One"
				clearable
				data={Object.values(EmployeeRole).map((role) => ({
					value: role,
					label: employeeRoleDisplayName[role],
				}))}
				key={form.key("role")}
				{...form.getInputProps("role")}
			/>

			<TextInput
				mt="sm"
				label="Name"
				placeholder="Input Name"
				key={form.key("name")}
				{...form.getInputProps("name")}
			/>

			<TextInput
				mt="sm"
				label="Email Address"
				placeholder="Input Email Address"
				key={form.key("email")}
				{...form.getInputProps("email")}
			/>

			<Button mt="sm" variant="filled" type="submit">
				Submit
			</Button>
		</form>
	)
}
