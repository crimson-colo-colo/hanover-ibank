import { UTCDate } from "@date-fns/utc"

import {
	ActionIcon,
	Flex,
	Modal,
	Paper,
	Popover,
	ScrollArea,
	Select,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { DatePicker } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { ContentStatus } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"
import {
	IconCalendar,
	IconCheck,
	IconPencil,
	IconProgress,
	IconStar,
	IconStarFilled,
	IconUser,
} from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { ContentOwnerSelect } from "@/components/ContentOwnerSelect.tsx"
import { FilePreview, FilePreviewControls, FilePreviewProvider } from "@/components/FilePreview.tsx"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { contentStatusDisplayName } from "@/lib/enums.ts"
import { queryClient, trpc } from "@/lib/trpc.ts"
import type { ContentListItem } from "../../server/routers/content.ts"

type EditableField =
	| "title"
	| "owner"
	| "lastModifiedDate"
	| "expirationDate"
	| "status"
	| "tags"
	| "checkedOutById"
	| null

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

	const options = {
		onSuccess() {
			queryClient.invalidateQueries({ queryKey: trpc.content.list.queryKey() })
		},
	}

	const updateTitle = useMutation(trpc.content.updateTitle.mutationOptions(options))
	const updateOwner = useMutation(trpc.content.updateOwner.mutationOptions(options))
	const updateLastModifiedDate = useMutation(
		trpc.content.updateLastModifiedDate.mutationOptions(options)
	)
	const updateExpirationDate = useMutation(
		trpc.content.updateExpirationDate.mutationOptions(options)
	)
	const updateStatus = useMutation(trpc.content.updateStatus.mutationOptions(options))

	const titleRef = useRef<HTMLInputElement>(null)
	const statusRef = useRef<HTMLSelectElement>(null)

	function setEditingField(field: EditableField) {
		_setEditingField(field)
		if (field === "title") {
			requestAnimationFrame(() => {
				titleRef.current?.select()
			})
		} else if (field === "status") {
			requestAnimationFrame(() => {
				const event = new MouseEvent("mousedown", { bubbles: true })
				statusRef.current?.dispatchEvent(event)
			})
		}
	}

	async function onFieldEdit(field: EditableField, value: string) {
		notifications.show({
			title: "field edited",
			message: `edited ${field} to ${value}`,
		})
		setEditingField(null)
		if (field === "title") {
			await updateTitle.mutateAsync({ id: content.id, title: value })
		}
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
			<Modal.Content bg="transparent" p="xl" className="flex flex-col w-full h-screen gap-lg">
				{/** biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
				{/** biome-ignore lint/a11y/useKeyWithClickEvents: backdrop */}
				<div className="absolute inset-0" onClick={closeFilePreview} />
				<Modal.Header bdrs="md">
					<Flex gap="sm" align="center">
						<FileTypeIcon fileType={fileType} />
						<Modal.Title className="font-semibold font-display">{content.title}</Modal.Title>
						<FilePreviewControls />
					</Flex>
					<Modal.CloseButton />
				</Modal.Header>
				<Flex gap="lg" className="flex-1 min-h-0 overflow-hidden">
					<FilePreview />
					<Paper w="350px" className="h-full min-h-0 border-gray-300 shrink-0">
						<ScrollArea className="h-full" px="md">
							<Stack gap="md" py="md">
								<Title
									order={4}
									className="flex items-center gap-2 px-1 leading-tight metadata-field"
								>
									<EditableTextField
										field="title"
										value={content.title}
										editingField={editingField}
										setEditingField={setEditingField}
										onFieldEdit={onFieldEdit}
										ref={titleRef}
									/>
									<ActionIcon variant="transparent">
										<IconStar />
									</ActionIcon>
									{/* {<IconStarFilled />} */}
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
										<Text className="flex items-center gap-2 text-gray-600 metadata-field">
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
								<EditableCheckField
									field="checkedOutById"
									value=""
									// value={content.checkedOutById}
									label="Checked Out"
									editingField={editingField}
									setEditingField={setEditingField}
									onFieldEdit={onFieldEdit}
								/>
								<div className="flex items-center gap-2 text-gray-600 metadata-field">
									<IconProgress className="text-gray-800" />
									Status{" "}
									{editingField !== "status" ? (
										<>
											<span className="text-gray-800">
												{contentStatusDisplayName[content.status]}
											</span>
											<ActionIcon
												className="metadata-edit"
												variant="subtle"
												onClick={() => setEditingField("status")}
											>
												<IconPencil />
											</ActionIcon>
										</>
									) : (
										<select
											ref={statusRef}
											required
											defaultValue={content.status}
											onChange={(e) => {
												if (e.target.value) {
													onFieldEdit("status", e.target.value)
												}
											}}
											onBlur={() => {
												onFieldEdit("status", statusRef.current?.value ?? "")
											}}
										>
											<option value="" disabled>
												Select status...
											</option>
											{Object.values(ContentStatus).map((status) => (
												<option key={status} value={status}>
													{contentStatusDisplayName[status]}
												</option>
											))}
										</select>
									)}
								</div>
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
			<span className="px-1 py-1 truncate metadata-content">{value}</span>
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
			className="w-full px-1 py-1 border-none max-w-none bg-gray-50"
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

function EditableCheckField({
	value,
	field,
	label,
	editingField,
	setEditingField,
	onFieldEdit,
}: {
	value: string
	field: NonNullable<EditableField>
	label: string
	editingField: EditableField
	setEditingField: (field: EditableField) => void
	onFieldEdit: (field: NonNullable<EditableField>, value: string) => void
}) {
	return editingField !== field ? (
		<>
			<span className="px-1 py-1 truncate metadata-content">{value}</span>
			<ActionIcon className="metadata-edit" variant="subtle" onClick={() => setEditingField(field)}>
				<IconCheck />
			</ActionIcon>
		</>
	) : (
		<input
			type="checkbox"
			defaultValue={value}
			onBlur={(e) => {
				onFieldEdit(field, e.target.value)
			}}
			className="w-full px-1 py-1 border-none max-w-none bg-gray-50"
		/>
	)
}
