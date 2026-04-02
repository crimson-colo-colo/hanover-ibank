import { TextInput } from "@mantine/core"

function UrlInput() {
	return (
		<TextInput
			size="xs"
			radius="xs"
			label="Paste Hyperlink or URL of document"
			placeholder="URL or Hyperlink"
			error="Invalid URL or hyperlink"
		/>
	)
}

export default UrlInput
