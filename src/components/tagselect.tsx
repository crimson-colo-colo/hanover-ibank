import { Combobox, Input, InputBase, useCombobox } from "@mantine/core"
import z from "zod"

const fileTypes = ["Reference Material", "Workflow Material"]

const type = z.enum(fileTypes).or(z.undefined())

function TagSelect({
	value,
	onChange,
}: {
	value: z.infer<typeof type>
	onChange: (val: z.infer<typeof type>) => void
}) {
	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
	})
	const options = fileTypes.map((item) => (
		<Combobox.Option value={item} key={item}>
			{item}
		</Combobox.Option>
	))

	return (
		<Combobox
			store={combobox}
			onOptionSubmit={(val) => {
				onChange(type.parse(val))
				combobox.closeDropdown()
			}}
		>
			<Combobox.Target>
				<InputBase
					component="button"
					type="button"
					pointer
					rightSection={<Combobox.Chevron />}
					rightSectionPointerEvents="none"
					onClick={() => combobox.toggleDropdown()}
				>
					{value || <Input.Placeholder>Select Document Type</Input.Placeholder>}
				</InputBase>
			</Combobox.Target>

			<Combobox.Dropdown>
				<Combobox.Options>{options}</Combobox.Options>
			</Combobox.Dropdown>
		</Combobox>
	)
}

export default TagSelect
