import { Button, Group, InputLabel, Radio, Stack, TextInput, Tooltip } from "@mantine/core"
import { schemaResolver, useForm } from "@mantine/form"
import { EmployeeRole } from "@prisma/browser.ts"
import { IconInfoCircle, IconLoader2 } from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import z from "zod"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

function InfoTooltip({ label }: { label: string }) {
	return (
		<Tooltip label={label} multiline w={260} withArrow position="top-start">
			<IconInfoCircle
				size={14}
				stroke={1.5}
				style={{ color: "var(--mantine-color-dimmed)", cursor: "default" }}
				onClick={(e) => e.preventDefault()}
			/>
		</Tooltip>
	)
}

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
					<Group gap={4} align="center">
						Name <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="User's full name, e.g. John Doe" />
					</Group>
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
					<Group gap={4} align="center">
						Email <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="Used for login, password resets, and notifications" />
					</Group>
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
					<Group gap={4} align="center">
						Username <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="Used for login and display. Must be unique across all users" />
					</Group>
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
					<Group gap={4} align="center">
						Password <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="The initial password for the user" />
					</Group>
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
					<Group gap={4} align="center">
						Confirm Password <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="Re-enter the password to confirm" />
					</Group>
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
					<Group gap={4} align="center">
						 Role <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="Determines the user's permissions and access level within the system" />
					</Group>
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
