import { Button, Group, Radio, Stack, TextInput } from "@mantine/core"
import { schemaResolver, useForm } from "@mantine/form"
import { EmployeeRole } from "@prisma/browser.ts"
import { IconLoader2 } from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import z from "zod"
import { LabelWithTooltip } from "@/components/FormComponents.tsx"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

const createSchema = z
	.object({
		name: z.string().min(3).max(100),
		email: z.email(),
		username: z.string().min(3).max(100),
		role: z.enum(Object.values(EmployeeRole)),
		password: z.string().min(4).max(100),
		confirmPassword: z.string().min(4).max(100),
	})
	.refine((data) => data.password === data.confirmPassword, {
		path: ["confirmPassword"],
		message: "Passwords do not match",
	})

export function CreateUserForm({ onSuccess, close }: { onSuccess: () => void; close: () => void }) {
	const createUser = useMutation(trpc.admin.createUser.mutationOptions())

	const createForm = useForm<z.input<typeof createSchema>, z.infer<typeof createSchema>>({
		initialValues: {
			name: "",
			email: "",
			username: "",
			password: "",
			confirmPassword: "",
			role: "" as EmployeeRole,
		},
		validate: schemaResolver(createSchema, { sync: true }),
		transformValues: createSchema.parse,
	})

	return (
		<form
			onSubmit={createForm.onSubmit((values) => {
				createUser.mutate(values, { onSuccess })
			})}
		>
			<TextInput
				withAsterisk={false}
				label={
					<LabelWithTooltip tooltip="User's full name, e.g. John Doe." required>
						Name
					</LabelWithTooltip>
				}
				placeholder="User name"
				required
				key={createForm.key("name")}
				{...createForm.getInputProps("name")}
			/>

			<TextInput
				mt="sm"
				withAsterisk={false}
				label={
					<LabelWithTooltip tooltip="Used for login, password resets, and notifications." required>
						Email
					</LabelWithTooltip>
				}
				placeholder="User email"
				required
				type="email"
				key={createForm.key("email")}
				{...createForm.getInputProps("email")}
			/>

			<TextInput
				mt="sm"
				withAsterisk={false}
				label={
					<LabelWithTooltip
						tooltip="Used for login and display. Must be unique across all users."
						required
					>
						Username
					</LabelWithTooltip>
				}
				placeholder="User username"
				required
				key={createForm.key("username")}
				{...createForm.getInputProps("username")}
			/>

			<TextInput
				mt="sm"
				withAsterisk={false}
				label={
					<LabelWithTooltip tooltip="The initial password for the user." required>
						Password
					</LabelWithTooltip>
				}
				placeholder="User password"
				type="password"
				required
				autoComplete="new-password"
				key={createForm.key("password")}
				{...createForm.getInputProps("password")}
			/>

			<TextInput
				mt="sm"
				withAsterisk={false}
				label={
					<LabelWithTooltip tooltip="Re-enter the password to confirm." required>
						Confirm Password
					</LabelWithTooltip>
				}
				placeholder="Confirm password"
				type="password"
				required
				autoComplete="new-password"
				key={createForm.key("confirmPassword")}
				{...createForm.getInputProps("confirmPassword")}
			/>

			<Radio.Group
				mt="sm"
				withAsterisk={false}
				label={
					<LabelWithTooltip
						tooltip="Determines the user's permissions and access level within the system."
						required
					>
						Role
					</LabelWithTooltip>
				}
				required
				key={createForm.key("role")}
				{...createForm.getInputProps("role")}
			>
				<Stack gap="xs" mt="xs">
					{Object.entries(employeeRoleDisplayName).map(([value, label]) => (
						<Radio key={value} value={value} label={label as string} />
					))}
				</Stack>
			</Radio.Group>

			<Group justify="flex-end" mt="md" gap="sm">
				<Button
					variant="subtle"
					onClick={() => {
						createForm.reset()
						close()
					}}
					disabled={createUser.isPending}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={createUser.isPending}>
					{createUser.isPending ? <IconLoader2 className="animate-spin" /> : "Create"}
				</Button>
			</Group>
		</form>
	)
}
