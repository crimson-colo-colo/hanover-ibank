import { UTCDate } from "@date-fns/utc"
import { ActionIcon, Popover, Text } from "@mantine/core"
import { DatePicker } from "@mantine/dates"
import { IconCalendar, IconPencil } from "@tabler/icons-react"
import type { EditableField } from "@/components/MetadataSidebar.tsx"

export function EditableDateField({
	field,
	label,
	value,
	editingField,
	setEditingField,
	onFieldEdit,
}: {
	field: "lastModifiedDate" | "expirationDate"
	label: string
	value: Date
	editingField: EditableField | null
	setEditingField: (field: EditableField | null) => void
	onFieldEdit: (field: EditableField, value: string) => void
}) {
	return (
		<Popover
			shadow="md"
			opened={editingField === field}
			onClose={() => setEditingField(null)}
			onDismiss={() => setEditingField(null)}
			closeOnClickOutside
			withArrow
		>
			<Popover.Target>
				<Text className="flex items-center gap-2 text-gray-600 metadata-field">
					<IconCalendar className="text-gray-800" />
					{label} <span className="text-gray-800">{new UTCDate(value).toDateString()}</span>
					<ActionIcon
						className="metadata-edit"
						variant="subtle"
						onClick={() => setEditingField(field)}
					>
						<IconPencil />
					</ActionIcon>
				</Text>
			</Popover.Target>
			<Popover.Dropdown>
				<DatePicker
					defaultValue={new UTCDate(value).toISOString().split("T")[0]}
					defaultDate={new UTCDate(value)}
					onChange={(date) => {
						if (date) {
							onFieldEdit(field, new UTCDate(date).toISOString())
						}
					}}
				/>
			</Popover.Dropdown>
		</Popover>
	)
}
