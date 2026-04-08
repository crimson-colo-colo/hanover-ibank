import {
	Button,
	Group,
	InputDescription,
	InputLabel,
	MultiSelect,
	Select,
	TextInput,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { schemaResolver, useForm } from "@mantine/form"
import { ContentStatus, DocumentType, EmployeeRole } from "@prisma/browser.ts"
import { IconDeviceFloppy } from "@tabler/icons-react"
import z from "zod"
import { ContentOwnerSelect } from "@/components/ContentOwnerSelect.tsx"
import {
	contentStatusDisplayName,
	documentTypeDisplayName,
	employeeRoleDisplayName,
} from "@/lib/enums.ts"

interface EditContentModalProps {
	content: z.infer<typeof schema>
	ownerEmail?: string
	onSubmit: (values: z.infer<typeof schema>) => void
}

const schema = z.object({
	id: z.string(),
	title: z.string(),
	ownerId: z.string(),
	intendedAudience: z.array(z.enum(Object.values(EmployeeRole))),
	lastModifiedDate: z.iso.date(),
	expirationDate: z.iso.date(),
	documentType: z.enum(Object.values(DocumentType)),
	status: z.enum(Object.values(ContentStatus)),
})

export function EditContentForm({ content, ownerEmail, onSubmit }: EditContentModalProps) {
	const form = useForm({
		initialValues: {
			id: content.id,
			title: content.title,
			ownerId: content.ownerId,
			intendedAudience: content.intendedAudience,
			lastModifiedDate: content.lastModifiedDate,
			expirationDate: content.expirationDate,
			documentType: content.documentType,
			status: content.status,
		},
		validate: schemaResolver(schema, { sync: true }),
		transformValues: schema.parse,
	})
	return (
		<form onSubmit={form.onSubmit(onSubmit)} noValidate>
			<TextInput
				label="Content Title"
				description="Enter a human-readable name for the content."
				placeholder="Important Document"
				required
				key={form.key("title")}
				{...form.getInputProps("title")}
			/>

			<MultiSelect
				mt="sm"
				label="Intended Audience"
				description="Select the employee roles that are the intended audience for this content. This is used to help route the content to the appropriate people."
				placeholder="Select..."
				data={Object.values(EmployeeRole).map((role) => ({
					value: role,
					label: employeeRoleDisplayName[role],
				}))}
				required
				key={form.key("intendedAudience")}
				{...form.getInputProps("intendedAudience")}
			/>

			<InputLabel mt="sm" required>
				Content Owner
			</InputLabel>
			<InputDescription mb={4}>
				Search for the owner of this content by name or email.
			</InputDescription>
			<ContentOwnerSelect form={form} initialSearchValue={ownerEmail} />

			<DatePickerInput
				mt="sm"
				label="Last Modified Date"
				description="Select the date this content was last modified."
				placeholder="Select date"
				required
				key={form.key("lastModifiedDate")}
				{...form.getInputProps("lastModifiedDate")}
			/>

			<DatePickerInput
				mt="sm"
				label="Expiration Date"
				description="Select the date this content expires. Expired content must be reviewed and re-approved prior to usage."
				placeholder="Select date"
				required
				key={form.key("expirationDate")}
				{...form.getInputProps("expirationDate")}
			/>

			<Select
				mt="sm"
				label="Content Category"
				description="Select the category that best describes this content."
				placeholder="Select..."
				data={Object.values(DocumentType).map((type) => ({
					value: type,
					label: documentTypeDisplayName[type],
				}))}
				required
				key={form.key("documentType")}
				{...form.getInputProps("documentType")}
			/>

			<Select
				mt="sm"
				label="Document Status"
				description="Select the current lifecycle status of this content."
				placeholder="Select..."
				data={Object.values(ContentStatus).map((status) => ({
					value: status,
					label: contentStatusDisplayName[status],
				}))}
				required
				key={form.key("status")}
				{...form.getInputProps("status")}
			/>

			<Group mt="md" justify="flex-end">
				<Button
					type="submit"
					loading={form.submitting}
					leftSection={<IconDeviceFloppy size={20} />}
				>
					Save
				</Button>
			</Group>
		</form>
	)
}
