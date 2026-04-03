import { Button, Select, TextInput } from "@mantine/core"
import { useState } from "react"
import { OwnerField } from "@/components/OwnerField.tsx"
import TagSelect from "@/components/tagselect.tsx"
import UrlInput from "@/components/urlinput.tsx"

export function InfoInputForm() {
	const [owner, setOwner] = useState<string | undefined>()
	const [tag, setTag] = useState<string | undefined>()
	const [url, setUrl] = useState<string | undefined>()
	return (
		<form>
			<Select
				mt="sm"
				label="What is Your Role?"
				placeholder="Pick One"
				data={["Underwriter", "Business Analyst"]}
			/>

			<TextInput mt="sm" label="First Name" placeholder="Input Name" />

			<TextInput mt="sm" label="Input Name" placeholder="Input Name" />

			<TextInput mt="sm" label="Input Email Adress" placeholder="Input Email Adress" />

			<OwnerField value={owner} onChange={(v) => setOwner(v)} />
			<TagSelect value={tag} onChange={(v) => setTag(v)} />
			<UrlInput value={url} onChange={(v) => setUrl(v)} />

			<Button mt="sm" variant="filled">
				Submit
			</Button>
		</form>
	)
}
