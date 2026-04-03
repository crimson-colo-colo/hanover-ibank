import { Button, Select, TextInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useState } from "react"
import { OwnerField } from "@/components/OwnerField.tsx"
import TagSelect from "@/components/tagselect.tsx"
import UrlInput from "@/components/urlinput.tsx"

export function InfoInputForm() {
	const [owner, setOwner] = useState<string | undefined>()
	const [tag, setTag] = useState<string | undefined>()
	const [url, setUrl] = useState<string | undefined>()
	return (
		<form className="max-w-md mx-auto">
			<Select
				mt="sm"
				label="Your Role"
				placeholder="Pick One"
				data={["Underwriter", "Business Analyst"]}
				clearable
			/>

			<TextInput mt="sm" label="Name" placeholder="Input Name" />

			<TextInput mt="sm" label="Owner First Name" placeholder="Input Owner First Name" />

			<TextInput mt="sm" label="Owner Email Adress" placeholder="Input Owner Email Address" />

			<DatePickerInput mt="sm" label="Deadline" placeholder="Pick date" />

			<Select
				mt="sm"
				label="What is the status of document you are uploading?"
				placeholder="Select One"
				data={["Complete", "Incomplete", "Under Review"]}
				clearable
			/>

			<OwnerField value={owner} onChange={(v) => setOwner(v)} />
			<TagSelect value={tag} onChange={(v) => setTag(v)} />
			<UrlInput value={url} onChange={(v) => setUrl(v)} />

			<Button mt="sm" variant="filled">
				Submit
			</Button>
		</form>
	)
}
