import { UTCDate } from "@date-fns/utc"
import { ActionIcon, Popover } from "@mantine/core"
import { DatePicker } from "@mantine/dates"
import { IconCalendar, IconPencil } from "@tabler/icons-react"
import type { EditableField } from "@/components/MetadataSidebar.tsx"

export function EditableDateField({
	enabled,
	field,
	label,
	value,
	editingField,
	setEditingField,
	onFieldEdit,
}: {
	enabled: boolean
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
				<div
					className="flex flex-col @xs:flex-row items-start @xs:items-center @xs:gap-2 text-gray-800 dark:text-gray-300 metadata-field"
					data-enabled={enabled}
				>
					<div className="@xs:contents flex items-center gap-2">
						<IconCalendar />
						<span className="text-gray-600">{label}</span>
					</div>
					<div className="@xs:contents flex items-center gap-2 ml-8 @xs:ml-0">
						<span>{new UTCDate(value).toDateString()}</span>
						<ActionIcon
							className="metadata-edit"
							variant="subtle"
							onClick={() => setEditingField(field)}
							disabled={!enabled}
						>
							<IconPencil />
						</ActionIcon>
					</div>
				</div>
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
