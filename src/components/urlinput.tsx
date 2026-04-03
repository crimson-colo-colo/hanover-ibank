import { TextInput } from "@mantine/core"
import z from "zod"

const type = z.string().or(z.undefined())

function UrlInput({
	value,
	onChange,
}: {
	value: z.infer<typeof type>
	onChange: (val: z.infer<typeof type>) => void
}) {
	return (
		<TextInput
			size="xs"
			radius="xs"
			mt="sm"
			label="Paste Hyperlink or URL of document"
			placeholder="URL or Hyperlink"
			error="Invalid URL or hyperlink"
			value={value}
			onChange={(e) => onChange(type.parse(e.target.value))}
		/>
	)
}

export default UrlInput
