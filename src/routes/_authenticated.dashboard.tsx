import { useAuth0 } from "@auth0/auth0-react"
import { Button, Flex, Modal, Paper, SimpleGrid, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconFile, IconLink } from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import clsx from "clsx"
import { useState } from "react"
import { EditContentForm } from "@/components/EditContentForm.tsx"
import { formatBytes } from "@/lib/content.ts"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { queryClient, trpc, trpcClient } from "@/lib/trpc.ts"

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: RoleDashboard,
})

function RoleDashboard() {
	const auth0 = useAuth0()
	const content = useQuery(trpc.content.list.queryOptions())
	const [editingItem, setEditingItem] = useState<
		NonNullable<(typeof content)["data"]>["content"][number] | null
	>(null)
	const [editDialogOpen, { open: openEditDialog, close: closeEditDialog }] = useDisclosure(false)

	const updateContent = useMutation(
		trpc.content.update.mutationOptions({
			onSuccess() {
				queryClient.invalidateQueries({
					queryKey: trpc.content.list.queryKey(),
				})
			},
		})
	)
	return (
		<main>
			<header className="w-full bg-primary text-white p-4 rounded-lg">
				<Title>
					Welcome,{" "}
					{auth0.user?.name ?? auth0.user?.nickname ?? auth0.user?.preferred_username ?? "User"}
				</Title>
				<small className="uppercase tracking-wider text-gray-200 font-semibold mb-3">
					{content.data ? employeeRoleDisplayName[content.data.role] : ""}
				</small>
			</header>

			<div>
				<section>
					<h2 className="mt-6 mb-4 text-xl font-semibold">Content</h2>
					<SimpleGrid minColWidth={250}>
						{content.data?.content.map((item) => (
							<Paper
								{...(item.type === "Link"
									? { component: "a", target: "_blank", href: item.url! }
									: {
											component: "div",
											onClick: async () => {
												try {
													const { url } = await trpcClient.content.download.query({ id: item.id })
													window.open(url, "_blank")
												} catch (error) {
													notifications.show({
														title: "Failed to download content",
														message:
															error instanceof Error ? error.message : "An unknown error occurred",
														color: "red",
													})
												}
											},
										})}
								key={item.id}
								shadow="xs"
								className={clsx(
									"p-4 border border-gray-200 text-left rounded-lg hover:-translate-y-1 transition-transform text-black",
									item.type === "Object" && "cursor-pointer"
								)}
							>
								<Flex align="start">
									<h3 className="font-semibold m-0 truncate" title={item.title}>
										{item.title}
									</h3>
									{item.type === "Link" ? (
										<IconLink className="ml-auto shrink-0" />
									) : (
										<IconFile className="ml-auto shrink-0" />
									)}
								</Flex>
								<p className="text-sm text-gray-600 mt-1 mb-2">
									{item.type === "Link"
										? new URL(item.url!).hostname
										: formatBytes(content.data?.objectMetadata.get(item.id)?.size || 0)}
								</p>
								<div className="text-sm text-gray-700 space-y-1">
									<p className="m-0">
										<strong>Owner:</strong> {item.owner.name}
									</p>
									<p className="m-0">
										<strong>Last Modified:</strong>{" "}
										{new Date(item.lastModifiedDate).toLocaleString()}
									</p>
									<p className="m-0">
										<strong>Expires:</strong> {new Date(item.expirationDate).toLocaleDateString()}
									</p>
								</div>
								<Button
									mt="sm"
									variant="white"
									size="sm"
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										setEditingItem(item)
										openEditDialog()
									}}
								>
									Edit Metadata
								</Button>
							</Paper>
						))}
					</SimpleGrid>
				</section>
				<Modal opened={editDialogOpen} onClose={closeEditDialog} title="Edit Content Metadata">
					{editingItem && (
						<EditContentForm
							content={{
								...editingItem,
								expirationDate: editingItem.expirationDate.toISOString().split("T")[0],
								lastModifiedDate: editingItem.lastModifiedDate.toISOString().split("T")[0],
							}}
							ownerEmail={editingItem.owner.email}
							onSubmit={(values) => {
								updateContent.mutate(values)
								setEditingItem(null)
								closeEditDialog()
							}}
						/>
					)}
				</Modal>
			</div>
		</main>
	)
}
