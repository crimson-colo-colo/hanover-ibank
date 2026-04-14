import { UTCDate } from "@date-fns/utc"
import {
	ActionIcon,
	Flex,
	Modal,
	Paper,
	Popover,
	ScrollArea,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { DatePicker } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { FileType } from "@shared/filetype.ts"
import { IconCalendar, IconPencil, IconUser } from "@tabler/icons-react"
import { useRef, useState } from "react"
import { ContentOwnerSelect } from "@/components/ContentOwnerSelect.tsx"
import { FilePreview, FilePreviewControls, FilePreviewProvider } from "@/components/FilePreview.tsx"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import type { ContentListItem } from "../../server/routers/content.ts"

type EditableField = "title" | "owner" | "lastModifiedDate" | "expirationDate" | null

export function PreviewModal({
	closeFilePreview,
	content,
	fileType,
}: {
	closeFilePreview: () => void
	content: ContentListItem
	fileType: FileType
}) {
	const [editingField, _setEditingField] = useState<EditableField>(null)

	function setEditingField(field: EditableField) {
		_setEditingField(field)
		if (field === "title") {
			requestAnimationFrame(() => {
				titleRef.current?.select()
			})
		}
	}
	const titleRef = useRef<HTMLInputElement>(null)

	function onFieldEdit(field: EditableField, value: string) {
		notifications.show({
			title: "field edited",
			message: `edited ${field} to ${value}`,
		})
		setEditingField(null)
	}

	const form = useForm({
		initialValues: {
			ownerId: content.owner.id,
			intendedAudience: [],
		},
	})

	return (
		<FilePreviewProvider
			content={content}
			fileType={fileType ?? FileType.Unknown}
			closeViewer={closeFilePreview}
		>
			<Modal.Content bg="transparent" p="xl" className="h-screen flex flex-col w-full gap-lg">
				{/** biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
				{/** biome-ignore lint/a11y/useKeyWithClickEvents: backdrop */}
				<div className="absolute inset-0" onClick={closeFilePreview} />
				<Modal.Header bdrs="md">
					<Flex gap="sm" align="center">
						<FileTypeIcon fileType={fileType} />
						<Modal.Title className="font-display font-semibold">{content.title}</Modal.Title>
						<FilePreviewControls />
					</Flex>
					<Modal.CloseButton />
				</Modal.Header>
				<Flex gap="lg" className="flex-1 min-h-0 overflow-hidden">
					<FilePreview />
					<Paper w="400px" className="h-full min-h-0 border-gray-300">
						<ScrollArea className="h-full" px="md">
							<Stack gap="md" py="md">
								<Title
									order={4}
									className="metadata-field flex items-center gap-2 leading-tight px-1"
								>
									<EditableTextField
										field="title"
										value={content.title}
										editingField={editingField}
										setEditingField={setEditingField}
										onFieldEdit={onFieldEdit}
										ref={titleRef}
									/>
								</Title>
								<Popover
									shadow="md"
									opened={editingField === "owner"}
									onDismiss={() => {
										onFieldEdit("owner", form.getValues().ownerId)
									}}
									closeOnClickOutside
									withArrow
								>
									<Popover.Target>
										<Text className="flex items-center gap-2 metadata-field text-gray-600">
											<IconUser className="text-gray-800" />
											Owned by <span className="text-gray-800">{content.owner.name}</span>
											<ActionIcon
												className="metadata-edit"
												variant="subtle"
												onClick={() => setEditingField("owner")}
											>
												<IconPencil />
											</ActionIcon>
										</Text>
									</Popover.Target>
									<Popover.Dropdown w="300px">
										<ContentOwnerSelect form={form} initialSearchValue={content.owner.email} />
									</Popover.Dropdown>
								</Popover>
								<EditableDateField
									field="lastModifiedDate"
									label="Last modified"
									value={content.lastModifiedDate}
									editingField={editingField}
									setEditingField={setEditingField}
									onFieldEdit={onFieldEdit}
								/>
								<EditableDateField
									field="expirationDate"
									label="Expires"
									value={content.expirationDate}
									editingField={editingField}
									setEditingField={setEditingField}
									onFieldEdit={onFieldEdit}
								/>
							</Stack>
						</ScrollArea>
					</Paper>
				</Flex>
			</Modal.Content>
		</FilePreviewProvider>
	)
}

function EditableTextField({
	value,
	field,
	editingField,
	setEditingField,
	onFieldEdit,
	ref,
}: {
	value: string
	field: NonNullable<EditableField>
	editingField: EditableField
	setEditingField: (field: EditableField) => void
	onFieldEdit: (field: NonNullable<EditableField>, value: string) => void
	ref: React.RefObject<HTMLInputElement | null>
}) {
	return editingField !== field ? (
		<>
			<span className="metadata-content truncate px-1 py-1">{value}</span>
			<ActionIcon className="metadata-edit" variant="subtle" onClick={() => setEditingField(field)}>
				<IconPencil />
			</ActionIcon>
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
			className="max-w-none w-full px-1 py-1 border-none bg-gray-50"
		/>
	)
}

function EditableDateField({
	field,
	label,
	value,
	editingField,
	setEditingField,
	onFieldEdit,
}: {
	field: Extract<NonNullable<EditableField>, "lastModifiedDate" | "expirationDate">
	label: string
	value: Date
	editingField: EditableField
	setEditingField: (field: EditableField) => void
	onFieldEdit: (field: NonNullable<EditableField>, value: string) => void
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
				<Text className="metadata-field flex items-center gap-2 text-gray-600">
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
