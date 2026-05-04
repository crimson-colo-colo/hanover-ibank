import { UTCDate } from "@date-fns/utc"
import {
	ActionIcon,
	Alert,
	Button,
	Flex,
	Menu,
	Modal,
	Popover,
	Stack,
	Text,
	TextInput,
	Title,
	Tooltip,
} from "@mantine/core"
import { Dropzone } from "@mantine/dropzone"
import { useForm } from "@mantine/form"

import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { type ContentStatus, ContentType, EmployeeRole, TagCategory } from "@prisma/browser.ts"
import { ContentFilter } from "@shared/enum.ts"
import { FileType } from "@shared/filetype.ts"
import type { ContentListItem } from "@shared/types.ts"
import {
	IconCheck,
	IconCircleArrowUpRight,
	IconCircleCheck,
	IconDeviceFloppy,
	IconDoorEnter,
	IconDoorExit,
	IconDownload,
	IconEdit,
	IconFileTypeDocx,
	IconFileTypePpt,
	IconFileTypeXls,
	IconFileUpload,
	IconMessageCircleUser,
	IconPencil,
	IconProgress,
	IconStar,
	IconStarFilled,
	IconTag,
	IconTrash,
	IconUser,
	IconUserShare,
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
	insideModal = true,
}: {
	content: ContentListItem
	closePreview: () => void
	insideModal?: boolean
}) {
	const { data: profile } = useQuery(trpc.user.getProfile.queryOptions())
	const [editingField, _setEditingField] = useState<EditableField | null>(null)
	const [urlEdit, setURLEdit] = useState<string | undefined>(undefined)
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
					queryClient.invalidateQueries({
						queryKey: trpc.preview.getPlaintextContent.queryKey({ id: content.id }),
					}),
				])
			},
		})
	)
	const updateLink = useMutation(trpc.content.updateLink.mutationOptions(options))

	const [pendingOwner, setPendingOwner] = useState<{ id: string; name: string } | null>(null)
	const [pendingTagChange, setPendingTagChange] = useState<{ stringifiedTags: string } | null>(null)

	const isIntendedAudience =
		content.tags.some((tag) => tag.category === TagCategory.IntendedAudience) &&
		content.tags.some(
			(tag) => tag.category === TagCategory.IntendedAudience && tag.name === profile?.role
		)
	const isCheckedOutByOther = content.checkedOutBy && content.checkedOutBy.id !== profile?.id

	const ableToEdit =
		!isCheckedOutByOther && (isIntendedAudience || profile?.role === EmployeeRole.Admin)
	const isCheckedOut = content.checkedOutBy !== null
	const canEdit = ableToEdit && isCheckedOut
	const canTransferOwnership =
		content.owner.id === profile?.id || profile?.role === EmployeeRole.Admin
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
	const ableToDelete =
		profile?.role === EmployeeRole.Admin || (!isCheckedOutByOther && isIntendedAudience)
	const canDelete = ableToDelete && isCheckedOut
	const canUpdateLink =
		content.type !== ContentType.Object &&
		(content.checkedOutBy?.id === profile?.id ||
			(content.checkedOutBy?.id && profile?.role === EmployeeRole.Admin))

	const objectMetadata = content.type === ContentType.Object ? content.object.Metadata : undefined
	const fileType = objectMetadata?.filetype as string | undefined

	const officeLauncher = (() => {
		if (fileType === FileType.Excel) {
			return {
				label: "Open in Excel",
				color: "green",
				scheme: "ms-excel:ofe|u|",
				icon: <IconFileTypeXls strokeWidth={1.5} />,
			}
		}

		if (fileType === FileType.Powerpoint) {
			return {
				label: "Open in PowerPoint",
				color: "orange",
				scheme: "ms-powerpoint:ofe|u|",
				icon: <IconFileTypePpt strokeWidth={1.5} />,
			}
		}

		if (fileType === FileType.WordDocument) {
			return {
				label: "Open in Word",
				color: "blue",
				scheme: "ms-word:ofe|u|",
				icon: <IconFileTypeDocx strokeWidth={1.5} />,
			}
		}

		return undefined
	})()

	const [confirmCheckoutOpen, { open: openConfirmCheckout, close: closeConfirmCheckout }] =
		useDisclosure(false)
	const [confirmCheckinOpen, { open: openConfirmCheckin, close: closeConfirmCheckin }] =
		useDisclosure(false)
	const [confirmDeleteOpen, { open: openConfirmDelete, close: closeConfirmDelete }] =
		useDisclosure(false)
	const [fileEditDialogOpen, { open: openFileEditDialog, close: closeFileEditDialog }] =
		useDisclosure(false)
	const [confirmOwnerOpen, { open: openConfirmOwner, close: closeConfirmOwner }] =
		useDisclosure(false)

	const [confirmTagChange, { open: openConfirmTagChange, close: closeConfirmTagChange }] =
		useDisclosure(false)

	const [linkEditDialogOpen, { open: openLinkEditDialog, close: closeLinkEditDialog }] =
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
		<>
			<Stack gap="md" className="h-full @container">
				{insideModal && (
					<Flex gap="sm" justify="space-between">
						<Title
							order={4}
							p={0}
							m={0}
							className="flex items-center gap-2 px-1 leading-tight truncate metadata-field"
							data-enabled={ableToEdit}
						>
							<EditableTextField
								enabled={canEdit}
								field="title"
								value={content.title}
								editingField={editingField}
								setEditingField={setEditingField}
								onFieldEdit={onFieldEdit}
								ref={titleRef}
								ableToEdit={ableToEdit}
								disabledTooltip={canEdit}
							/>
						</Title>

						<ActionIcon
							variant="transparent"
							loading={favoriteContent.isPending || unfavoriteContent.isPending}
							onClick={async () => {
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
				)}
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
					opened={editingField === "owner"}
					onDismiss={() => {
						setEditingField(null)
					}}
					closeOnClickOutside
					withArrow
				>
					<Popover.Target>
						<div className="flex flex-col @xs:flex-row items-start @xs:items-center @xs:gap-2 text-gray-800 dark:text-gray-300 metadata-field">
							<div className="@xs:contents flex items-center gap-2">
								<IconUser />
								<span className="text-gray-600">Owned by</span>
							</div>
							<div className="@xs:contents flex items-center gap-2 ml-8 @xs:ml-0">
								<span>{content.owner.name}</span>
								{ableToEdit && (
									<CannotEditToolTip disabled={canEdit}>
										<Tooltip
											label="You must be the content owner to transfer ownership"
											withArrow
											arrowSize={8}
											disabled={canTransferOwnership || !canEdit}
										>
											<ActionIcon
												className="metadata-edit"
												variant="subtle"
												disabled={!canTransferOwnership || !canEdit}
												onClick={() => setEditingField("owner")}
											>
												<IconPencil />
											</ActionIcon>
										</Tooltip>
									</CannotEditToolTip>
								)}
							</div>
						</div>
					</Popover.Target>
					<Popover.Dropdown w="300px">
						<ContentOwnerSelect
							form={form}
							initialSearchValue={content.owner.email}
							onSelect={(id, name) => {
								setPendingOwner({ id, name })
								setEditingField(null)
								openConfirmOwner()
							}}
						/>
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
					ableToEdit={ableToEdit}
					disabledTooltip={canEdit}
				/>
				<EditableDateField
					enabled={canEdit}
					field="expirationDate"
					label="Expires"
					value={content.expirationDate}
					editingField={editingField}
					setEditingField={setEditingField}
					onFieldEdit={onFieldEdit}
					ableToEdit={ableToEdit}
					disabledTooltip={canEdit}
				/>
				<Menu
					opened={editingField === "status"}
					onDismiss={() => setEditingField(null)}
					withArrow
					shadow="sm"
				>
					<Menu.Target>
						<div
							className="flex flex-col @xs:flex-row items-start @xs:items-center @xs:gap-2 text-gray-800 dark:text-gray-300 metadata-field"
							data-enabled={ableToEdit}
						>
							<div className="@xs:contents flex items-center gap-2">
								{contentStatusDisplayName[content.status] === "Incomplete" ? (
									<IconProgress />
								) : contentStatusDisplayName[content.status] === "Under Review" ? (
									<IconMessageCircleUser />
								) : (
									<IconCircleCheck />
								)}
								<span className="text-gray-600">Status</span>
							</div>
							<div className="@xs:contents flex items-center gap-2 ml-8 @xs:ml-0">
								<span>{contentStatusDisplayName[content.status]}</span>
								{ableToEdit && (
									<CannotEditToolTip disabled={canEdit}>
										<ActionIcon
											className="metadata-edit"
											variant="subtle"
											onClick={() => setEditingField("status")}
											disabled={!canEdit}
										>
											<IconPencil />
										</ActionIcon>
									</CannotEditToolTip>
								)}
							</div>
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
							const stringifiedTags = stringifyTagList(tags)
							if (profile?.role !== undefined) {
								if (
									!stringifiedTags.includes(profile.role) &&
									profile.role !== EmployeeRole.Admin
								) {
									setPendingTagChange({ stringifiedTags: stringifyTagList(tags) })
									setEditingField(null)
									openConfirmTagChange()
								} else {
									onFieldEdit("tags", stringifyTagList(tags))
								}
							}
						}}
					/>
				</div>
				{canUpdateFile && (
					<>
						<Button
							fullWidth
							variant="light"
							leftSection={<IconFileUpload />}
							onClick={openFileEditDialog}
						>
							Update file
						</Button>

						{officeLauncher && (
							<Button
								fullWidth
								color={officeLauncher.color}
								leftSection={officeLauncher.icon}
								onClick={async () => {
									const res = await trpcClient.content.getWebDAVToken.query({
										id: content.id,
									})
									const url = `${officeLauncher.scheme}${window.location.origin}/webdav/${res.token}/${res.filename}`
									window.location.href = url
								}}
							>
								{officeLauncher.label}
							</Button>
						)}
					</>
				)}
				{canUpdateLink && (
					<Button fullWidth variant="light" leftSection={<IconEdit />} onClick={openLinkEditDialog}>
						Update link
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
							Open link
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
			<Modal
				opened={confirmOwnerOpen}
				onClose={() => {
					closeConfirmOwner()
					setPendingOwner(null)
				}}
				title="Transfer ownership"
			>
				<Text>
					Are you sure you want to transfer ownership to <strong>{pendingOwner?.name}</strong>? They
					will be the new owner of this content.
				</Text>
				<Flex gap="md" justify="flex-end" mt="md">
					<Button
						variant="subtle"
						color="gray"
						onClick={() => {
							closeConfirmOwner()
							setPendingOwner(null)
						}}
						disabled={updateOwner.isPending}
					>
						Cancel
					</Button>
					<Button
						loading={updateOwner.isPending}
						onClick={async () => {
							if (!pendingOwner) return
							await onFieldEdit("owner", pendingOwner.id)
							closeConfirmOwner()
							setPendingOwner(null)
						}}
						leftSection={<IconUserShare />}
					>
						Transfer ownership
					</Button>
				</Flex>
			</Modal>
			<Modal
				opened={confirmTagChange}
				onClose={() => {
					closeConfirmTagChange()
					setPendingTagChange(null)
				}}
				title={<strong>Warning</strong>}
			>
				<Text>
					Removing your role from the intended audience will remove your access to edit this
					content. Continue anyway?
				</Text>
				<Flex gap="md" justify="flex-end" mt="md">
					<Button
						variant="subtle"
						color="gray"
						onClick={() => {
							closeConfirmTagChange()
							setPendingTagChange(null)
						}}
						disabled={updateTags.isPending}
					>
						Cancel
					</Button>
					<Button
						loading={updateOwner.isPending || checkInContent.isPending}
						onClick={async () => {
							if (pendingTagChange?.stringifiedTags !== undefined) {
								onFieldEdit("tags", pendingTagChange?.stringifiedTags)
								await checkInContent.mutateAsync({ id: content.id })
							}
							closeConfirmTagChange()
							setPendingTagChange(null)
						}}
						leftSection={<IconDeviceFloppy />}
						color="red"
					>
						Continue
					</Button>
				</Flex>
			</Modal>
			<Modal
				opened={linkEditDialogOpen}
				onClose={closeLinkEditDialog}
				title={<strong>Edit Link</strong>}
			>
				<Text>Enter a new link URL.</Text>
				<TextInput
					mt="sm"
					withAsterisk={false}
					placeholder={content.type === ContentType.Link ? content.url : "https://example.com/"}
					value={urlEdit ?? ""}
					onChange={(event) => setURLEdit(event.currentTarget.value)}
				/>
				<Flex gap="md" justify="flex-end" mt="md">
					<Button
						variant="subtle"
						color="gray"
						onClick={() => {
							closeLinkEditDialog()
						}}
						disabled={updateLink.isPending}
					>
						Cancel
					</Button>
					<Button
						loading={updateLink.isPending}
						onClick={async () => {
							if (urlEdit !== undefined) {
								await updateLink.mutateAsync({ id: content.id, url: urlEdit })
							}
							closeLinkEditDialog()
						}}
						leftSection={<IconEdit />}
					>
						Confirm edit
					</Button>
				</Flex>
			</Modal>
		</>
	)
}
function CannotEditToolTip({
	children,
	disabled,
}: {
	children: React.ReactNode
	disabled: boolean
}) {
	return (
		<Tooltip
			label="Please check out this content in order to edit it"
			withArrow
			arrowSize={8}
			disabled={disabled}
		>
			{children}
		</Tooltip>
	)
}
