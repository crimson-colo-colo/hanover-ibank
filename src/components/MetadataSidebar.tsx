import { UTCDate } from "@date-fns/utc"
import {
	ActionIcon,
	Alert,
	Button,
	Flex,
	Menu,
	Modal,
	Paper,
	Popover,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { Dropzone } from "@mantine/dropzone"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { type ContentStatus, EmployeeRole, TagCategory } from "@prisma/browser.ts"
import { ContentFilter } from "@shared/enum.ts"
import {
	IconCheck,
	IconCircleArrowUpRight,
	IconDoorEnter,
	IconDoorExit,
	IconDownload,
	IconFileUpload,
	IconPencil,
	IconProgress,
	IconStar,
	IconStarFilled,
	IconTag,
	IconTrash,
	IconUser,
} from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { ContentOwnerSelect } from "@/components/ContentOwnerSelect.tsx"
import { ContentTagsInput } from "@/components/ContentTagsInput.tsx"
import { EditableDateField } from "@/components/EditableDateField.tsx"
import { EditableTextField } from "@/components/EditableTextField.tsx"
import { contentStatusDisplayName } from "@/lib/enums.ts"
import { stringifyTagList, unstringifyTagList } from "@/lib/tags.ts"
import { queryClient, trpc, trpcClient } from "@/lib/trpc.ts"
import type { ContentListItem } from "../../server/routers/content.ts"

export type EditableField =
	| "title"
	| "owner"
	| "lastModifiedDate"
	| "expirationDate"
	| "status"
	| "tags"

export function MetadataSidebar({
	content,
	closePreview,
}: {
	content: ContentListItem
	closePreview: () => void
}) {
	const { data: profile } = useQuery(trpc.user.getProfile.queryOptions())
	const [editingField, _setEditingField] = useState<EditableField | null>(null)
	const options = {
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: trpc.content.list.queryKey({ filter: ContentFilter.Own }),
				}),
				queryClient.invalidateQueries({
					queryKey: trpc.content.list.queryKey({ filter: ContentFilter.All }),
				}),
				queryClient.invalidateQueries({
					queryKey: trpc.content.get.queryKey({ id: content.id }),
				}),
			])
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
	const checkInContent = useMutation(trpc.content.checkIn.mutationOptions(options))
	const checkOutContent = useMutation(trpc.content.checkOut.mutationOptions(options))
	const deleteContent = useMutation(
		trpc.content.delete.mutationOptions({
			onSuccess() {
				queryClient.invalidateQueries({
					queryKey: trpc.content.list.queryKey({ filter: ContentFilter.Own }),
				})
				queryClient.invalidateQueries({
					queryKey: trpc.content.list.queryKey({ filter: ContentFilter.All }),
				})
				queryClient.invalidateQueries({
					queryKey: trpc.content.get.queryKey({ id: content.id }),
				})
			},
		})
	)
	const updateContentFile = useMutation(
		trpc.content.updateFile.mutationOptions({
			async onSuccess() {
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: trpc.preview.getContentUrl.queryKey({ id: content.id }),
					}),
				])
			},
		})
	)

	const isIntendedAudience =
		content.tags.some((tag) => tag.category === TagCategory.IntendedAudience) &&
		content.tags.some(
			(tag) => tag.category === TagCategory.IntendedAudience && tag.name === profile?.role
		)
	const isCheckedOutByOther = content.checkedOutBy && content.checkedOutBy.id !== profile?.id

	const canEdit =
		!isCheckedOutByOther && (isIntendedAudience || profile?.role === EmployeeRole.Admin)
	const canCheckOut =
		!content.checkedOutBy && (isIntendedAudience || profile?.role === EmployeeRole.Admin)
	const canCheckIn =
		content.checkedOutBy?.id === profile?.id || profile?.role === EmployeeRole.Admin

	const isCheckInOverride =
		content.checkedOutBy?.id !== profile?.id && profile?.role === EmployeeRole.Admin
	const canUpdateFile =
		content.type !== "Link" &&
		(content.checkedOutBy?.id === profile?.id ||
			(content.checkedOutBy?.id && profile?.role === EmployeeRole.Admin))
	const canDelete =
		profile?.role === EmployeeRole.Admin || (!isCheckedOutByOther && isIntendedAudience)

	const [confirmCheckoutOpen, { open: openConfirmCheckout, close: closeConfirmCheckout }] =
		useDisclosure(false)
	const [confirmCheckinOpen, { open: openConfirmCheckin, close: closeConfirmCheckin }] =
		useDisclosure(false)
	const [confirmDeleteOpen, { open: openConfirmDelete, close: closeConfirmDelete }] =
		useDisclosure(false)
	const [fileEditDialogOpen, { open: openFileEditDialog, close: closeFileEditDialog }] =
		useDisclosure(false)

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
		setEditingField(null)
		if (field === "title") {
			await updateTitle.mutateAsync({ id: content.id, title: value })
		} else if (field === "owner") {
			await updateOwner.mutateAsync({ id: content.id, ownerId: value })
		} else if (field === "lastModifiedDate") {
			await updateLastModifiedDate.mutateAsync({
				id: content.id,
				lastModifiedDate: value.split("T")[0],
			})
		} else if (field === "expirationDate") {
			await updateExpirationDate.mutateAsync({
				id: content.id,
				expirationDate: value.split("T")[0],
			})
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
		<Paper w="350px" className="h-full min-h-0 shrink-0" p="md">
			<Stack gap="md" className="h-full">
				<Flex gap="sm" justify="space-between">
					<Title
						order={4}
						className="flex items-center gap-2 px-1 leading-tight truncate metadata-field"
						data-enabled={canEdit}
					>
						<EditableTextField
							enabled={canEdit}
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
				{content.checkedOutBy && (
					<>
						<Alert
							title={
								<Flex align="center" gap="xs">
									<IconDoorExit />
									Checked out
								</Flex>
							}
						>
							{content.checkedOutBy.id === profile?.id ? (
								<>
									You have this content checked out for editing. Check it back in when you're done
									to allow others to edit it.
								</>
							) : (
								<>
									Checked out by <strong>{content.checkedOutBy.name}</strong> (
									{content.checkedOutBy.email}). Only they can edit the content until it's checked
									back in.
								</>
							)}
						</Alert>
						{canCheckIn && (
							<Button fullWidth leftSection={<IconDoorEnter />} onClick={openConfirmCheckin}>
								{isCheckInOverride ? "Force check in" : "Check in"}
							</Button>
						)}
					</>
				)}
				<Popover
					shadow="md"
					data-enabled={canEdit}
					opened={editingField === "owner"}
					onDismiss={() => {
						onFieldEdit("owner", form.getValues().ownerId)
					}}
					closeOnClickOutside
					withArrow
				>
					<Popover.Target>
						<Text className="flex items-center gap-2 text-gray-800 dark:text-gray-300 metadata-field">
							<IconUser />
							<span className="text-gray-600">Owned by</span>
							<span>{content.owner.name}</span>
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
					enabled={canEdit}
					field="lastModifiedDate"
					label="Last modified"
					value={content.lastModifiedDate}
					editingField={editingField}
					setEditingField={setEditingField}
					onFieldEdit={onFieldEdit}
				/>
				<EditableDateField
					enabled={canEdit}
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
						<div
							className="flex items-center gap-2 text-gray-800 dark:text-gray-300 metadata-field"
							data-enabled={canEdit}
						>
							<IconProgress />
							<span className="text-gray-600">Status</span>
							<span>{contentStatusDisplayName[content.status]}</span>
							<ActionIcon
								className="metadata-edit"
								variant="subtle"
								onClick={() => setEditingField("status")}
								disabled={!canEdit}
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
								className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-950"
								onClick={() => {
									onFieldEdit("status", key)
									setEditingField(null)
								}}
								leftSection={
									content.status === key ? (
										<IconCheck className="text-gray-800 dark:text-gray-600" size={16} />
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
					<Text className="flex items-center gap-2 mb-2 text-gray-800 dark:text-gray-300 metadata-field">
						<IconTag />
						<span className="text-gray-600">Tags</span>
					</Text>
					<ContentTagsInput
						enabled={canEdit}
						value={content.tags}
						onChange={(tags) => {
							onFieldEdit("tags", stringifyTagList(tags))
						}}
					/>
				</div>
				{canUpdateFile && (
					<Button
						fullWidth
						variant="light"
						leftSection={<IconFileUpload />}
						onClick={openFileEditDialog}
					>
						Update file
					</Button>
				)}

				{content.checkedOutBy ? null : canCheckOut ? (
					<Popover
						shadow="sm"
						opened={confirmCheckoutOpen}
						onClose={closeConfirmCheckout}
						withArrow
					>
						<Popover.Target>
							<Button
								fullWidth
								variant="light"
								leftSection={<IconDoorExit />}
								onClick={openConfirmCheckout}
							>
								Check out
							</Button>
						</Popover.Target>
						<Popover.Dropdown className="max-w-80">
							<Text>Checking out this content will lock it for editing by other users.</Text>
							<Flex gap="md" justify="flex-end" mt="md">
								<Button
									variant="subtle"
									color="gray"
									onClick={closeConfirmCheckout}
									disabled={checkOutContent.isPending}
								>
									Cancel
								</Button>
								<Button
									loading={checkOutContent.isPending}
									onClick={async () => {
										await checkOutContent.mutateAsync({ id: content.id })
										closeConfirmCheckout()
									}}
									leftSection={<IconDoorExit />}
								>
									Check out
								</Button>
							</Flex>
						</Popover.Dropdown>
					</Popover>
				) : (
					<Alert>
						Not checked out. Only users in the intended audience or admins can check out this
						content for editing.
					</Alert>
				)}

				<div className="grow" />

				<Flex gap="sm">
					{content.type === "Link" ? (
						<Button
							component="a"
							href={content.url}
							target="_blank"
							rel="noopener noreferrer"
							fullWidth
							leftSection={<IconCircleArrowUpRight />}
						>
							Open Link
						</Button>
					) : (
						<Button
							fullWidth
							leftSection={<IconDownload />}
							onClick={async () => {
								try {
									const { url } = await trpcClient.content.download.query({ id: content.id })
									window.open(url)
								} catch (error) {
									notifications.show({
										title: "Download failed",
										message:
											error instanceof Error
												? error.message
												: "An unknown error occurred. Please try again.",
										color: "red",
									})
								}
							}}
						>
							Download
						</Button>
					)}

					{canDelete && (
						<ActionIcon variant="light" color="red" size="lg" onClick={openConfirmDelete}>
							<IconTrash />
						</ActionIcon>
					)}
				</Flex>
			</Stack>
			<Modal opened={confirmCheckinOpen} onClose={closeConfirmCheckin} title="Confirm check in">
				<Text>
					Ready to check this content back in? Others will be able to edit it once it's checked in.
				</Text>
				<Flex gap="md" justify="flex-end" mt="md">
					<Button
						variant="subtle"
						color="gray"
						onClick={closeConfirmCheckin}
						disabled={checkInContent.isPending}
					>
						Cancel
					</Button>
					<Button
						loading={checkInContent.isPending}
						onClick={async () => {
							await checkInContent.mutateAsync({ id: content.id })
							closeConfirmCheckin()
						}}
						leftSection={<IconDoorEnter />}
					>
						Check in
					</Button>
				</Flex>
			</Modal>
			<Modal opened={confirmDeleteOpen} onClose={closeConfirmDelete} title="Confirm delete">
				<Text>Are you sure you want to delete this content? This action cannot be undone.</Text>
				<Flex gap="md" justify="flex-end" mt="md">
					<Button
						variant="subtle"
						color="gray"
						onClick={closeConfirmDelete}
						disabled={deleteContent.isPending}
					>
						Cancel
					</Button>
					<Button
						loading={deleteContent.isPending}
						onClick={async () => {
							await deleteContent.mutateAsync({ ids: [content.id] })
							closeConfirmDelete()
							closePreview()
						}}
						leftSection={<IconTrash />}
						color="red"
					>
						Delete
					</Button>
				</Flex>
			</Modal>
			<Modal opened={fileEditDialogOpen} onClose={closeFileEditDialog} title="Edit Content File">
				<Text mb="md">
					Updating <b>{content.title}</b> with a new copy/version. This will replace the existing
					file but keep the same metadata.
				</Text>
				<div className="grid grid-cols-2 mb-4">
					<span className="font-semibold">Content owner</span>
					<span>{content.owner.email}</span>
					<span className="font-semibold">Last modified</span>
					<span>
						{content.lastModifiedDate && new UTCDate(content.lastModifiedDate).toLocaleString()}
					</span>
					<span className="font-semibold">Expiration date</span>
					<span>
						{content.expirationDate && new UTCDate(content.expirationDate).toLocaleString()}
					</span>
				</div>
				<Dropzone
					onDrop={async (files) => {
						if (files.length === 0) return
						await updateContentFile.mutateAsync({
							id: content.id,
							file: new Uint8Array(await files[0].arrayBuffer()).toBase64(),
						})
						closeFileEditDialog()
						notifications.show({
							title: "File updated",
							message: "The file has been updated successfully.",
							color: "emerald",
						})
					}}
					loading={updateContentFile.isPending}
					maxFiles={1}
					maxSize={50_000_000_000}
					onReject={(files) => {
						notifications.show({
							title: "Upload failed",
							message: files[0].errors.join("; "),
							color: "red",
						})
					}}
					className="bg-gray-50 hover:bg-gray-100"
				>
					<div className="flex flex-col items-center justify-center h-full gap-4 p-12 text-gray-500">
						<IconFileUpload size={48} className="" stroke={1} />
						<Text className="text-center">
							Drag and drop a file here, or click to select a file
						</Text>
					</div>
				</Dropzone>
			</Modal>
		</Paper>
	)
}
