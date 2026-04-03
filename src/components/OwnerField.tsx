import { TextInput } from "@mantine/core"
import z from "zod"

const type = z.string().or(z.undefined())

export function OwnerField({
	value,
	onChange,
}: {
	value: z.infer<typeof type>
	onChange: (val: z.infer<typeof type>) => void
}) {
	return (
		<TextInput
			mt="sm"
			label="Input Document Owner"
			placeholder={"Enter Name of Document Owner"}
			value={value}
			onChange={(e) => onChange(type.parse(e.target.value))}
		/>
	)
}
