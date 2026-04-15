import {
	ActionIcon,
	Flex,
	Menu,
	Paper,
	Popover,
	ScrollArea,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import type { ContentStatus } from "@prisma/browser.ts"
import {
	IconCheck,
	IconPencil,
	IconProgress,
	IconStar,
	IconStarFilled,
	IconTag,
	IconUser,
} from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { ContentOwnerSelect } from "@/components/ContentOwnerSelect.tsx"
import { ContentTagsInput } from "@/components/ContentTagsInput.tsx"
import { EditableDateField } from "@/components/EditableDateField.tsx"
import { EditableTextField } from "@/components/EditableTextField.tsx"
import { contentStatusDisplayName } from "@/lib/enums.ts"
import { stringifyTagList, unstringifyTagList } from "@/lib/tags.ts"
import { queryClient, trpc } from "@/lib/trpc.ts"
import type { ContentListItem } from "../../server/routers/content.ts"

export type EditableField =
	| "title"
	| "owner"
	| "lastModifiedDate"
	| "expirationDate"
	| "status"
	| "tags"

export function MetadataSidebar({ content }: { content: ContentListItem }) {
	const [editingField, _setEditingField] = useState<EditableField | null>(null)
	const options = {
		onSuccess() {
			queryClient.invalidateQueries({ queryKey: trpc.content.list.queryKey() })
			queryClient.invalidateQueries({
				queryKey: trpc.content.get.queryKey({ id: content.id }),
			})
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
	const updateTags = useMutation(trpc.content.updateTags.mutationOptions(options))
	const favoriteContent = useMutation(trpc.content.favorite.mutationOptions(options))
	const unfavoriteContent = useMutation(trpc.content.unfavorite.mutationOptions(options))

	const titleRef = useRef<HTMLInputElement>(null)
	const statusRef = useRef<HTMLInputElement>(null)

	function setEditingField(field: EditableField | null) {
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
		if (!content) return
		notifications.show({
			title: "field edited",
			message: `edited ${field} to ${value}`,
		})
		setEditingField(null)
		if (field === "title") {
			await updateTitle.mutateAsync({ id: content.id, title: value })
		} else if (field === "owner") {
			await updateOwner.mutateAsync({ id: content.id, ownerId: value })
		} else if (field === "lastModifiedDate") {
			await updateLastModifiedDate.mutateAsync({ id: content.id, lastModifiedDate: value })
		} else if (field === "expirationDate") {
			await updateExpirationDate.mutateAsync({ id: content.id, expirationDate: value })
		} else if (field === "status") {
			await updateStatus.mutateAsync({ id: content.id, status: value as ContentStatus })
		} else if (field === "tags") {
			await updateTags.mutateAsync({ id: content.id, tags: unstringifyTagList(value) })
		}
	}

	const form = useForm({
		initialValues: {
			ownerId: content?.owner.id ?? "",
			intendedAudience: [],
		},
	})

	useEffect(() => {
		if (content) {
			form.setValues({
				ownerId: content.owner.id,
			})
		}
	}, [content])

	return (
		<Paper w="350px" className="h-full min-h-0 shrink-0">
			<ScrollArea className="h-full" px="md">
				<Stack gap="md" py="md">
					<Flex gap="sm" justify="space-between">
						<Title
							order={4}
							className="flex items-center gap-2 px-1 leading-tight truncate metadata-field"
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
						<ActionIcon
							variant="transparent"
							loading={favoriteContent.isPending || unfavoriteContent.isPending}
							onClick={async (e) => {
								if (content.favorited) {
									await unfavoriteContent.mutateAsync({ id: content.id })
								} else {
									await favoriteContent.mutateAsync({ id: content.id })
								}
							}}
						>
							{content.favorited ? (
								<IconStarFilled className="fill-[#f8de1f]" size={20} />
							) : (
								<IconStar />
							)}
						</ActionIcon>
					</Flex>
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
					<Menu
						opened={editingField === "status"}
						onDismiss={() => setEditingField(null)}
						withArrow
						shadow="sm"
					>
						<Menu.Target>
							<div className="flex items-center gap-2 text-gray-600 metadata-field">
								<IconProgress className="text-gray-800" />
								Status{" "}
								<span className="text-gray-800">{contentStatusDisplayName[content.status]}</span>
								<ActionIcon
									className="metadata-edit"
									variant="subtle"
									onClick={() => setEditingField("status")}
								>
									<IconPencil />
								</ActionIcon>
							</div>
						</Menu.Target>
						<Menu.Dropdown>
							{Object.entries(contentStatusDisplayName).map(([key, display]) => (
								<Menu.Item
									key={key}
									px="sm"
									className="cursor-pointer hover:bg-gray-200"
									onClick={() => {
										onFieldEdit("status", key)
										setEditingField(null)
									}}
									leftSection={
										content.status === key ? (
											<IconCheck className="text-gray-800" size={16} />
										) : (
											<div className="w-4" />
										)
									}
								>
									{display}
								</Menu.Item>
							))}
						</Menu.Dropdown>
					</Menu>
					<div>
						<Text className="flex items-center gap-2 mb-2 text-gray-600 metadata-field">
							<IconTag className="text-gray-800" />
							<span>Tags</span>
						</Text>
						<ContentTagsInput
							value={content.tags}
							onChange={(tags) => {
								onFieldEdit("tags", stringifyTagList(tags))
							}}
						/>
					</div>
				</Stack>
			</ScrollArea>
		</Paper>
	)
}
