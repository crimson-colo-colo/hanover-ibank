import { Button, FileInput, MultiSelect, SegmentedControl, Select, TextInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { schemaResolver, useForm } from "@mantine/form"
import { ContentStatus, DocumentType, EmployeeRole } from "@prisma/browser.ts"
import { useState } from "react"
import z from "zod"
import {
	contentStatusDisplayName,
	documentTypeDisplayName,
	employeeRoleDisplayName,
} from "@/lib/enums.ts"

const schema = z.object({
	name: z.string().max(250),
	url: z.url().max(2000),
	email: z.email().max(320),
	intendedAudience: z.array(z.enum(Object.values(EmployeeRole))),
	// FIXME: Mantine 8.x date components work with string values instead of Dates, and
	// useForm isn't running zod transformers on submitted values. This should be z.date()
	// instead of z.string() when that is working.
	lastModifiedDate: z.string().max(200),
	expirationDate: z.string().max(200),
	documentType: z.enum(Object.values(DocumentType)),
	documentStatus: z.enum(Object.values(ContentStatus)),
	file: z.file().max(50_000_000_000).optional(),
})

export function InfoInputForm() {
	const form = useForm<z.infer<typeof schema>>({
		validate: schemaResolver(schema, { sync: true }),
	})

	function onSubmit(values: z.infer<typeof schema>) {
		console.dir(values)
	}

	type contentType = "url" | "file"
	const [contentType, setContentType] = useState<contentType>("url")
	const [file, setFile] = useState<File | null>(null)

	function userUploadedFile(newFile: File | null) {
		if (file === null && newFile === null) return // if the user switches tabs, don't clear the
		// text input unless there is a file that already is there
		let name: string

		if (newFile !== null) {
			name = newFile.name.substring(0, newFile.name.lastIndexOf("."))
		} else {
			name = ""
		}
		form.setFieldValue("file", newFile === null ? undefined : newFile)
		form.setFieldValue("name", name)

		setFile(newFile)
	}

	return (
		<form className="max-w-md mx-auto" onSubmit={form.onSubmit(onSubmit)}>
			<SegmentedControl<contentType>
				value={contentType}
				onChange={(value) => {
					if (contentType !== value) {
						userUploadedFile(null)
						form.setFieldValue("url", "")
					}
					setContentType(value)
				}}
				data={[
					{ label: "URL", value: "url" },
					{ label: "File", value: "file" },
				]}
			/>

			<TextInput
				mt="sm"
				label="Content Name"
				placeholder="Input Content Name"
				key={form.key("name")}
				{...form.getInputProps("name")}
			/>

			{contentType === "url" ? (
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
					key={form.key("file")}
					value={file}
					onChange={userUploadedFile}
					clearable
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
