import { Button, Group, InputDescription, InputLabel, Select, TextInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { schemaResolver, useForm } from "@mantine/form"
import { ContentStatus, TagCategory } from "@prisma/browser.ts"
import { IconDeviceFloppy } from "@tabler/icons-react"
import z from "zod"
import { ContentOwnerSelect } from "@/components/ContentOwnerSelect.tsx"
import { ContentTagsInput } from "@/components/ContentTagsInput.tsx"
import { LabelWithTooltip } from "@/components/FormComponents.tsx"
import { contentStatusDisplayName } from "@/lib/enums.ts"

interface EditContentModalProps {
	content: z.infer<typeof schema>
	ownerEmail?: string
	onSubmit: (values: z.infer<typeof schema>) => void
}

const schema = z.object({
	id: z.string(),
	title: z.string(),
	ownerId: z.string(),
	lastModifiedDate: z.iso.date(),
	expirationDate: z.iso.date(),
	status: z.enum(Object.values(ContentStatus)),
	tags: z.array(
		z.object({
			category: z.enum(Object.values(TagCategory)),
			name: z.string().min(1).max(50),
		})
	),
})

export function EditContentForm({ content, ownerEmail, onSubmit }: EditContentModalProps) {
	const form = useForm<z.input<typeof schema>, z.infer<typeof schema>>({
		initialValues: {
			id: content.id,
			title: content.title,
			ownerId: content.ownerId,
			lastModifiedDate: content.lastModifiedDate,
			expirationDate: content.expirationDate,
			status: content.status,
			tags: content.tags,
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

			<InputLabel mt="sm">
				<LabelWithTooltip
					tooltip="Add tags to help categorize this content. You can select from existing tags or create new ones."
					required
				>
					Content Tags
				</LabelWithTooltip>
			</InputLabel>
			<ContentTagsInput
				value={form.getValues().tags}
				onChange={(tags) => form.setFieldValue("tags", tags)}
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
