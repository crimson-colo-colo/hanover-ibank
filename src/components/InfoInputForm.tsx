import { Button, Select, TextInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useState } from "react"
import { OwnerField } from "@/components/OwnerField.tsx"
import TagSelect from "@/components/tagselect.tsx"
import UrlInput from "@/components/urlinput.tsx"

export function InfoInputForm() {
	const [owner, setOwner] = useState<string | undefined>()
	const [tag, setTag] = useState<string | undefined>()
	const [url, setUrl] = useState<string | undefined>("")
	return (
		<form className="max-w-md mx-auto">
			<TextInput mt="sm" label="Content Name" placeholder="Input Content Name" />

			<UrlInput value={url} onChange={(v) => setUrl(v)} />

			<OwnerField value={owner} onChange={(v) => setOwner(v)} />

			<TextInput
				mt="sm"
				label="Document Owner Email Address"
				placeholder="Input Document Owner Email Address"
			/>

			<Select
				mt="sm"
				label="Intended Audience for Document"
				placeholder="Select One"
				data={["Underwriter", "Business Analyst"]}
				clearable
			/>

			<DatePickerInput mt="sm" label="Last Modified Date" placeholder="Pick date" />

			<DatePickerInput mt="sm" label="Deadline" placeholder="Pick date" />

			<TagSelect value={tag} onChange={(v) => setTag(v)} />

			<Select
				mt="sm"
				label="Document Status"
				placeholder="Select One"
				data={["Complete", "Incomplete", "Under Review"]}
				clearable
			/>

			<Button mt="sm" variant="filled">
				Submit
			</Button>
		</form>
	)
}
