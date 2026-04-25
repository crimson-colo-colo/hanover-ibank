import { ActionIcon, Tooltip } from "@mantine/core"
import { IconPencil } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import type { EditableField } from "@/components/MetadataSidebar.tsx"
import { isTruncated } from "@/lib/isTruncated.ts"

export function EditableTextField({
	enabled,
	value,
	field,
	editingField,
	setEditingField,
	onFieldEdit,
	ref,
	ableToEdit,
	disabledTooltip
}: {
	enabled: boolean
	value: string
	field: EditableField
	editingField: EditableField | null
	setEditingField: (field: EditableField | null) => void
	onFieldEdit: (field: EditableField, value: string) => void
	ref: React.RefObject<HTMLInputElement | null>
	ableToEdit: boolean
	disabledTooltip: boolean
}) {
	const contentRef = useRef<HTMLElement>(null)
	const [truncated, setTruncated] = useState(false)
	useEffect(() => {
		if (contentRef.current) {
			setTruncated(isTruncated(contentRef.current))
		}
	}, [contentRef])

	return editingField !== field || !enabled ? (
		<>
			<Tooltip label={value} withArrow disabled={!truncated || editingField === "title"}>
				<span className="truncate metadata-content" ref={contentRef}>
					{value}
				</span>
			</Tooltip>
			{ableToEdit && (
				<Tooltip label="Please check out this content in order to edit it" withArrow arrowSize={8} disabled={disabledTooltip}>
					<ActionIcon
				className="metadata-edit"
				variant="subtle"
				onClick={() => setEditingField(field)}
				disabled={!enabled}
			>
				<IconPencil/>
			</ActionIcon>
				</Tooltip>)}
		</>
	) : (
		<input
			ref={ref}
			defaultValue={value}
			onBlur={(e) => {
				onFieldEdit(field, e.target.value)
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					onFieldEdit(field, ref.current?.value ?? "")
				}
			}}
			className="w-full px-1 py-1 border-none max-w-none bg-gray-50 dark:bg-gray-900"
		/>
	)
}
