import { Button, FileInput, MultiSelect, SegmentedControl, Select, TextInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { schemaResolver, useForm } from "@mantine/form"
import { ContentStatus, ContentType, DocumentType, EmployeeRole } from "@prisma/browser.ts"
import z from "zod"
import {
	contentStatusDisplayName,
	contentTypeDisplayName,
	documentTypeDisplayName,
	employeeRoleDisplayName,
} from "@/lib/enums.ts"
import { trpcClient } from "@/lib/trpc.ts"

const baseSchema = z.object({
	name: z.string().max(250).min(3),
	email: z.email().max(320),
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

export function InfoInputForm() {
	const form = useForm<z.input<typeof schema>, z.infer<typeof schema>>({
		initialValues: {
			name: "",
			contentType: "Object",
			url: "",
			file: undefined!,
			email: "",
			intendedAudience: [],
			lastModifiedDate: undefined!,
			expirationDate: undefined!,
			documentType: "" as DocumentType,
			documentStatus: "" as ContentStatus,
		} as z.input<typeof schema>,
		validate: schemaResolver(schema, { sync: true }),
		transformValues: schema.parse,
	})

	async function onSubmit(values: z.infer<typeof schema>) {
		await trpcClient.submitForms.createContent.mutate({
			...values,
			...{
				file:
					values.contentType === "Object"
						? new Uint8Array(await values.file.arrayBuffer()).toBase64()
						: undefined!,
			},
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
		<form className="max-w-md mx-auto" onSubmit={form.onSubmit(onSubmit)}>
			<SegmentedControl
				key={form.key("contentType")}
				{...form.getInputProps("contentType")}
				data={Object.entries(contentTypeDisplayName).map(([value, label]) => ({
					value,
					label,
				}))}
			/>

			<TextInput
				mt="sm"
				label="Content Name"
				placeholder="Input Content Name"
				key={form.key("name")}
				{...form.getInputProps("name")}
			/>

			{form.values.contentType === "Link" ? (
				<TextInput
					mt="sm"
					label="Paste Hyperlink or URL of document"
					placeholder="URL or Hyperlink"
					key={form.key("url")}
					{...form.getInputProps("url")}
				/>
			) : (
				<FileInput
					mt="sm"
					label="File Input"
					placeholder="Click this box to upload a file"
					clearable
					key={form.key("file")}
					{...form.getInputProps("file")}
				/>
			)}

			{/*<OwnerField value={owner} onChange={(v) => setOwner(v)} />*/}

			<TextInput
				mt="sm"
				label="Document Owner Email Address"
				placeholder="Input Document Owner Email Address"
				key={form.key("email")}
				{...form.getInputProps("email")}
			/>

			<MultiSelect
				mt="sm"
				label="Intended Audience for Document"
				placeholder="Select multiple"
				data={Object.values(EmployeeRole).map((role) => ({
					value: role,
					label: employeeRoleDisplayName[role],
				}))}
				clearable
				key={form.key("intendedAudience")}
				{...form.getInputProps("intendedAudience")}
			/>

			<DatePickerInput
				mt="sm"
				label="Last Modified Date"
				placeholder="Pick date"
				key={form.key("lastModifiedDate")}
				{...form.getInputProps("lastModifiedDate")}
			/>

			<DatePickerInput
				mt="sm"
				label="Deadline"
				placeholder="Pick date"
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
				placeholder="Select One"
				data={Object.values(ContentStatus).map((status) => ({
					value: status,
					label: contentStatusDisplayName[status],
				}))}
				clearable
				key={form.key("documentStatus")}
				{...form.getInputProps("documentStatus")}
			/>

			<Button mt="sm" type="submit" variant="filled">
				Submit
			</Button>
		</form>
	)
}
