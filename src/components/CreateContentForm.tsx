import { useAuth0 } from "@auth0/auth0-react"
import {
	Button,
	FileInput,
	Group,
	InputLabel,
	MultiSelect,
	SegmentedControl,
	Select,
	TextInput,
	Title,
	Tooltip,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { schemaResolver, useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { ContentStatus, ContentType, DocumentType, EmployeeRole } from "@prisma/browser.ts"
import { IconCalendar, IconCloudUpload, IconFileUpload, IconInfoCircle } from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { format } from "date-fns"
import z from "zod"
import { ContentOwnerSelect } from "@/components/ContentOwnerSelect.tsx"
import {
	contentStatusDisplayName,
	contentTypeDisplayName,
	documentTypeDisplayName,
	employeeRoleDisplayName,
} from "@/lib/enums.ts"
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

function LabelWithTooltip({
	children,
	tooltip,
	required,
}: {
	children: React.ReactNode
	tooltip: string
	required?: boolean
}) {
	return (
		<Group gap={4} align="center" mt="sm">
			<InputLabel required={required}>{children}</InputLabel>
			<InfoTooltip label={tooltip} />
		</Group>
	)
}

const baseSchema = z.object({
	name: z.string().max(250).min(3),
	ownerId: z.string().max(320),
	intendedAudience: z.array(z.enum(Object.values(EmployeeRole))).min(1),
	lastModifiedDate: z.iso.date(),
	expirationDate: z.iso.date(),
	documentType: z.enum(Object.values(DocumentType)),
	documentStatus: z.enum(Object.values(ContentStatus)),
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

export function CreateContentForm() {
	const auth0 = useAuth0()
	const createContent = useMutation(trpc.forms.createContent.mutationOptions())
	const form = useForm<z.input<typeof schema>, z.infer<typeof schema>>({
		initialValues: {
			name: "",
			contentType: "Object",
			url: "",
			file: undefined!,
			ownerId: auth0.user?.sub || "",
			intendedAudience: [],
			lastModifiedDate: format(new Date(), "yyyy-MM-dd"),
			expirationDate: undefined!,
			documentType: "" as DocumentType,
			documentStatus: "" as ContentStatus,
		} as z.input<typeof schema>,
		validate: schemaResolver(schema, { sync: true }),
		transformValues: schema.parse,
	})
	const navigate = useNavigate()

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
		navigate({ to: "/dashboard" })
		notifications.show({
			title: "Content created",
			message: "The content has been successfully created.",
			color: "emerald",
		})
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
			form.setFieldValue("name", ctx.value.name.substring(0, ctx.value.name.lastIndexOf(".")))
		}
	})

	return (
		<form className="max-w-[50ch] mx-auto" onSubmit={form.onSubmit(onSubmit)}>
			<Title order={2} mb="md">
				Create New Content
			</Title>

			<InputLabel required>Content Type</InputLabel>
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
						<Group gap={4} align="center">
							Content URL <span style={{ color: "var(--mantine-color-error)" }}>*</span>
							<InfoTooltip label="Enter the URL to link to. Must start with http:// or https://" />
						</Group>
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
						<Group gap={4} align="center">
							Content File <span style={{ color: "var(--mantine-color-error)" }}>*</span>
							<InfoTooltip label="Upload a file. Maximum size is 50 GB." />
						</Group>
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
					<Group gap={4} align="center">
						Content Name <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="Enter a human-readable name for the content." />
					</Group>
				}
				placeholder="Important Document"
				required
				key={form.key("name")}
				{...form.getInputProps("name")}
			/>

			<MultiSelect
				mt="sm"
				withAsterisk={false}
				label={
					<Group gap={4} align="center">
						Intended Audience <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="Select the employee roles that are the intended audience. This helps route content to the appropriate people." />
					</Group>
				}
				placeholder="Select..."
				data={Object.values(EmployeeRole).map((role) => ({
					value: role,
					label: employeeRoleDisplayName[role],
				}))}
				required
				key={form.key("intendedAudience")}
				{...form.getInputProps("intendedAudience")}
			/>

			<LabelWithTooltip required tooltip="Search for the owner of this content by name or email.">
				Content Owner
			</LabelWithTooltip>
			<ContentOwnerSelect form={form} initialSearchValue={auth0.user?.email} />

			<DatePickerInput
				mt="sm"
				withAsterisk={false}
				label={
					<Group gap={4} align="center">
						Last Modified Date <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="Select the date this content was last modified." />
					</Group>
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
					<Group gap={4} align="center">
						Expiration Date <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="Select the date this content expires. Expired content must be reviewed and re-approved before usage." />
					</Group>
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
					<Group gap={4} align="center">
						Content Category <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="Select the category that best describes this content." />
					</Group>
				}
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
				withAsterisk={false}
				label={
					<Group gap={4} align="center">
						Document Status <span style={{ color: "var(--mantine-color-error)" }}>*</span>
						<InfoTooltip label="Select the current lifecycle status of this content." />
					</Group>
				}
				placeholder="Select..."
				data={Object.values(ContentStatus).map((status) => ({
					value: status,
					label: contentStatusDisplayName[status],
				}))}
				required
				key={form.key("documentStatus")}
				{...form.getInputProps("documentStatus")}
			/>

			<Group justify="flex-end" mt="lg">
				<Button variant="subtle" color="gray" onClick={() => navigate({ to: "/dashboard" })}>
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
