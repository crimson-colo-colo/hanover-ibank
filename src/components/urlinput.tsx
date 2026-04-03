import { TextInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type z from "zod"
import type { schema } from "./InfoInputForm.tsx"

function UrlInput({ form }: { form: UseFormReturnType<z.infer<typeof schema>> }) {
	return (
		<TextInput
			mt="sm"
			label="Paste Hyperlink or URL of document"
			placeholder="URL or Hyperlink"
			key={form.key("url")}
			{...form.getInputProps("url")}
		/>
	)
}

export default UrlInput
