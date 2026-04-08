import { Button, Modal, Select, TextInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { schemaResolver, useForm } from "@mantine/form"
import { ContentStatus, DocumentType } from "@prisma/browser.ts"
import z from "zod"
import { contentStatusDisplayName, documentTypeDisplayName } from "@/lib/enums.ts"

interface EditContentModalProps {
	opened: boolean
	onClose: () => void
	content: z.infer<typeof schema>
	onSubmit: (values: z.infer<typeof schema>) => void
}

const schema = z.object({
	id: z.string(),
	name: z.string(),
	ownerId: z.string(),
	lastModifiedDate: z.iso.date(),
	expirationDate: z.iso.date(),
	documentType: z.enum(Object.values(DocumentType)),
	contentStatus: z.enum(Object.values(ContentStatus)),
})

export function EditContentModal({ opened, onClose, content, onSubmit }: EditContentModalProps) {
	const form = useForm({
		initialValues: {
			id: content.id,
			name: content.name,
			ownerId: content.ownerId,
			lastModifiedDate: content.lastModifiedDate,
			expirationDate: content.expirationDate,
			documentType: content.documentType,
			contentStatus: content.contentStatus,
		},
		validate: schemaResolver(schema, { sync: true }),
		transformValues: schema.parse,
	})
	return (
		<Modal opened={opened} onClose={onClose} title="Edit Metadata">
			<form onSubmit={form.onSubmit(onSubmit)} noValidate>
				<TextInput
					label="Content Name"
					placeholder="Important Document"
					required
					key={form.key("name")}
					{...form.getInputProps("name")}
				/>

				<TextInput
					mt="sm"
					label="Content Owner"
					placeholder="Owner ID"
					required
					key={form.key("ownerId")}
					{...form.getInputProps("ownerId")}
				/>

				<DatePickerInput
					mt="sm"
					label="Last Modified Date"
					placeholder="Select date"
					key={form.key("lastModifiedDate")}
					{...form.getInputProps("lastModifiedDate")}
				/>

				<DatePickerInput
					mt="sm"
					label="Expiration Date"
					placeholder="Select date"
					key={form.key("expirationDate")}
					{...form.getInputProps("expirationDate")}
				/>

				<Select
					mt="sm"
					label="Document Type"
					placeholder="Select One"
					data={Object.values(DocumentType).map((type) => ({
						value: type,
						label: documentTypeDisplayName[type],
					}))}
					clearable
					key={form.key("documentType")}
					{...form.getInputProps("documentType")}
				/>

				<Select
					mt="sm"
					label="Document Status"
					placeholder="Select..."
					data={Object.values(ContentStatus).map((status) => ({
						value: status,
						label: contentStatusDisplayName[status],
					}))}
					clearable
					key={form.key("documentStatus")}
					{...form.getInputProps("documentStatus")}
				/>

				<Button type="submit" loading={form.submitting} w={96}>
					Save
				</Button>
			</form>
		</Modal>
	)
}
