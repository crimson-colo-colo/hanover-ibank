import { useAuth0 } from "@auth0/auth0-react"
import {
	Button,
	FileInput,
	Group,
	InputLabel,
	SegmentedControl,
	Select,
	TextInput,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { schemaResolver, useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { ContentStatus, ContentType, TagCategory } from "@prisma/browser.ts"
import { IconCalendar, IconCloudUpload, IconFileUpload } from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { format } from "date-fns"
import z from "zod"
import { ContentOwnerSelect } from "@/components/ContentOwnerSelect.tsx"
import { ContentTagsInput } from "@/components/ContentTagsInput.tsx"
import { LabelWithTooltip } from "@/components/FormComponents.tsx"
import { contentStatusDisplayName, contentTypeDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

const baseSchema = z.object({
	name: z.string().max(250).min(3),
	ownerId: z.string().max(320),
	lastModifiedDate: z.iso.date(),
	expirationDate: z.iso.date(),
	tags: z.array(
		z.object({
			category: z.enum(Object.values(TagCategory)),
			name: z.string().min(1).max(50),
		})
	),
	contentStatus: z.enum(Object.values(ContentStatus)),
})

const linkSchema = baseSchema.extend({
	contentType: z.literal(ContentType.Link),
	url: z.url().max(2000),
})

const fileSchema = baseSchema.extend({
	contentType: z.literal(ContentType.Object),
	file: z.file().max(50_000_000_000),
})

const schema = z.discriminatedUnion("contentType", [linkSchema, fileSchema])

interface Props {
	onSuccess: () => void
}

export function CreateContentForm({ onSuccess }: Props) {
	const auth0 = useAuth0()
	const createContent = useMutation(trpc.forms.createContent.mutationOptions())
	const form = useForm<z.input<typeof schema>, z.infer<typeof schema>>({
		initialValues: {
			name: "",
			contentType: "Object",
			url: "",
			file: undefined!,
			ownerId: auth0.user?.sub || "",
			lastModifiedDate: format(new Date(), "yyyy-MM-dd"),
			expirationDate: undefined!,
			tags: [],
			contentStatus: "" as ContentStatus,
			// intendedAudience: [],
			// documentType: "" as DocumentType,
		} as z.input<typeof schema>,
		validate: schemaResolver(schema, { sync: true }),
		transformValues: schema.parse,
	})

	async function onSubmit(values: z.infer<typeof schema>) {
		await createContent.mutateAsync({
			...values,
			...{
				file:
					values.contentType === "Object"
						? new Uint8Array(await values.file.arrayBuffer()).toBase64()
						: undefined!,
			},
		})
		notifications.show({
			title: "Content created",
			message: "The content has been successfully created.",
			color: "emerald",
		})
		onSuccess()
	}

	form.watch("contentType", (ctx) => {
		form.setFieldValue("url", "")
		form.setFieldValue("file", undefined!)
	})

	form.watch("file", (ctx) => {
		if (ctx.previousValue == null && ctx.value == null) {
			// if the user switches tabs, don't clear the text input unless there is a file that already is there
			return
		}
		if (ctx.value === undefined) {
			form.setFieldValue("name", "")
		} else {
			form.setFieldValue("name", ctx.value.name)
		}
	})

	return (
		<form onSubmit={form.onSubmit(onSubmit)}>
			<LabelWithTooltip
				tooltip="Choose whether this content is a file upload or an external link."
				required
			>
				Content Type
			</LabelWithTooltip>
			<SegmentedControl
				size="sm"
				fullWidth
				key={form.key("contentType")}
				{...form.getInputProps("contentType")}
				data={Object.entries(contentTypeDisplayName).map(([value, label]) => ({
					value,
					label,
				}))}
				radius="lg"
			/>

			{form.values.contentType === "Link" ? (
				<TextInput
					mt="sm"
					withAsterisk={false}
					label={
						<LabelWithTooltip
							tooltip="Enter the URL to link to. Must start with http:// or https://."
							required
						>
							Content URL
						</LabelWithTooltip>
					}
					placeholder="https://example.com/"
					required
					key={form.key("url")}
					{...form.getInputProps("url")}
				/>
			) : (
				<FileInput
					mt="sm"
					withAsterisk={false}
					label={
						<LabelWithTooltip tooltip="Upload a file. Maximum size is 50 GB." required>
							Content File
						</LabelWithTooltip>
					}
					placeholder="Choose file..."
					leftSection={<IconFileUpload size={20} stroke={1.5} />}
					clearable
					required
					key={form.key("file")}
					{...form.getInputProps("file")}
				/>
			)}

			<TextInput
				mt="sm"
				withAsterisk={false}
				label={
					<LabelWithTooltip tooltip="Enter a human-readable name for the content." required>
						Content Name
					</LabelWithTooltip>
				}
				placeholder="Important Document"
				required
				key={form.key("name")}
				{...form.getInputProps("name")}
			/>

			{/* <MultiSelect
				mt="sm"
				withAsterisk={false}
				label={
					<LabelWithTooltip
						tooltip="Select the employee roles that are the intended audience. This helps route content to the appropriate people."
						required
					>
						Intended Audience
					</LabelWithTooltip>
				}
				placeholder="Select..."
				data={Object.values(EmployeeRole).map((role) => ({
					value: role,
					label: employeeRoleDisplayName[role],
				}))}
				required
				key={form.key("intendedAudience")}
				{...form.getInputProps("intendedAudience")}
			/> */}

			<InputLabel mt="sm">
				<LabelWithTooltip tooltip="Search for the owner of this content by name or email." required>
					Content Owner
				</LabelWithTooltip>
			</InputLabel>
			<ContentOwnerSelect form={form} initialSearchValue={auth0.user?.email} />

			<DatePickerInput
				mt="sm"
				withAsterisk={false}
				label={
					<LabelWithTooltip tooltip="Select the date this content was last modified." required>
						Last Modified Date
					</LabelWithTooltip>
				}
				placeholder="Select date"
				leftSection={<IconCalendar size={20} stroke={1.5} />}
				required
				key={form.key("lastModifiedDate")}
				{...form.getInputProps("lastModifiedDate")}
			/>

			<DatePickerInput
				mt="sm"
				withAsterisk={false}
				label={
					<LabelWithTooltip
						tooltip="Select the date this content expires. Expired content must be reviewed and re-approved before usage."
						required
					>
						Expiration Date
					</LabelWithTooltip>
				}
				placeholder="Select date"
				leftSection={<IconCalendar size={20} stroke={1.5} />}
				required
				key={form.key("expirationDate")}
				{...form.getInputProps("expirationDate")}
			/>

			<Select
				mt="sm"
				withAsterisk={false}
				label={
					<LabelWithTooltip tooltip="Select the current lifecycle status of this content." required>
						Content Status
					</LabelWithTooltip>
				}
				placeholder="Select..."
				data={Object.values(ContentStatus).map((status) => ({
					value: status,
					label: contentStatusDisplayName[status],
				}))}
				required
				key={form.key("contentStatus")}
				{...form.getInputProps("contentStatus")}
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

			<Group justify="flex-end" mt="lg">
				<Button variant="subtle" color="gray" onClick={onSuccess}>
					Cancel
				</Button>
				<Button
					type="submit"
					variant="filled"
					disabled={createContent.isPending}
					leftSection={<IconCloudUpload size={20} stroke={1.5} />}
				>
					{createContent.isPending ? "Creating..." : "Create Content"}
				</Button>
			</Group>
		</form>
	)
}
