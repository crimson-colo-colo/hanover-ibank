import { Button, Radio, Stack, TextInput } from "@mantine/core"
import { schemaResolver, useForm } from "@mantine/form"
import { EmployeeRole } from "@prisma/browser.ts"
import { IconLoader2 } from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import z from "zod"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

export const updateSchema = z.object({
	id: z.string(),
	name: z.string().min(3).max(100),
	email: z.email(),
	username: z.string().min(3).max(100),
	role: z.enum(Object.values(EmployeeRole)),
})

export type UpdateUserValues = z.infer<typeof updateSchema>

interface UpdateUserFormProps {
	user: UpdateUserValues
	onSuccess: () => void
}

export function UpdateUserForm({ user, onSuccess }: UpdateUserFormProps) {
	const updateUser = useMutation(trpc.admin.updateUser.mutationOptions())

	const updateForm = useForm<z.input<typeof updateSchema>, z.infer<typeof updateSchema>>({
		initialValues: user,
		validate: schemaResolver(updateSchema, { sync: true }),
		transformValues: updateSchema.parse,
	})

	useEffect(() => {
		updateForm.setValues(user)
	}, [user])

	return (
		<form
			onSubmit={updateForm.onSubmit((values) => {
				updateUser.mutate(values, { onSuccess })
			})}
		>
			<TextInput
				label="Name"
				description="User's full name, e.g. John Doe."
				placeholder="User name"
				required
				key={updateForm.key("name")}
				{...updateForm.getInputProps("name")}
			/>

			<TextInput
				mt="sm"
				label="Email"
				description="Used for login, password resets, and notifications."
				placeholder="User email"
				required
				key={updateForm.key("email")}
				{...updateForm.getInputProps("email")}
			/>

			<TextInput
				mt="sm"
				label="Username"
				description="Used for login and display. Must be unique across all users."
				placeholder="User username"
				required
				key={updateForm.key("username")}
				{...updateForm.getInputProps("username")}
			/>

			<Radio.Group
				mt="sm"
				label="Role"
				description="Changing a user's role may affect their content access and permissions. Use with caution."
				required
				key={updateForm.key("role")}
				{...updateForm.getInputProps("role")}
			>
				<Stack gap="xs" mt="xs">
					{Object.entries(employeeRoleDisplayName).map(([value, label]) => (
						<Radio key={value} value={value} label={label as string} />
					))}
				</Stack>
			</Radio.Group>

			<Button type="submit" mt="md" disabled={updateUser.isPending}>
				{updateUser.isPending ? <IconLoader2 className="animate-spin" /> : "Save"}
			</Button>
		</form>
	)
}
