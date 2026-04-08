import { Button, Flex, Modal, Paper, SimpleGrid } from "@mantine/core"
import { IconFile, IconLink } from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { inferRouterOutputs } from "@trpc/server" //need inferRouterOutputs and AppRouter for Mantine's Modal, so that when the edit metadata button is clicked, it doesn't go to the link, and just opens the modal
import { useState } from "react"
import { EditContentModal } from "@/components/edit-content-modal.tsx"
import { formatBytes, getContentTarget } from "@/lib/content.ts"
import { queryClient, trpc, trpcClient } from "@/lib/trpc.ts"
import type { AppRouter } from "../../server/router.ts"

export const Route = createFileRoute("/_authenticated/analyst")({
	component: RouteComponent,
})

type RouterOutputs = inferRouterOutputs<AppRouter>
type ContentItem = RouterOutputs["content"]["list"]["content"][0]
function RouteComponent() {
	const content = useQuery(trpc.content.list.queryOptions({ role: "BusinessAnalyst" }))
	const [editingItem, setEditingItem] = useState<ContentItem | null>(null)

	const updateContent = useMutation({
		mutationFn: (input: {
			id: string
			modifiedAt?: string
			expirationDate?: string
			ownerName?: string
		}) => trpcClient.content.update.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.content.list.queryOptions({ role: "BusinessAnalyst" }).queryKey,
			})
		},
	})
	return (
		<div>
			<header className="w-full bg-primary-hover text-white p-4 rounded-xl">
				<h1 className="m-0 -mb-1">Welcome, Alice</h1>
				<small className="uppercase tracking-wider text-gray-300 font-semibold mb-3">
					Business Analyst
				</small>
			</header>

			<section>
				<h2 className="mt-6 mb-4 text-xl font-semibold">Content</h2>
				<SimpleGrid minColWidth={250}>
					{content.data?.content.map((item) => (
						<Paper
							component={"a"}
							target="_blank"
							href={getContentTarget(item)}
							key={item.id}
							shadow="xs"
							className="p-4 border border-border rounded-lg hover:-translate-y-1 transition-transform text-black"
						>
							<Flex align="start">
								<h3 className="font-semibold m-0">{item.title}</h3>
								{item.type === "Link" ? (
									<IconLink className="ml-auto" />
								) : (
									<IconFile className="ml-auto" />
								)}
							</Flex>
							<p className="text-sm text-gray-600 mt-1 mb-0">
								{item.type === "Link" && item.url
									? new URL(item.url!).hostname
									: formatBytes(content.data?.objectMetadata.get(item.id)?.size || 0)}
							</p>
							<div className="text-sm text-gray-700 space-y-1">
								<p className="m-0">
									<strong>Owner:</strong> {item.owner.name}
								</p>
								<p className="m-0">
									<strong>Last Modified:</strong> {new Date(item.lastModifiedDate).toLocaleString()}
								</p>
								<p className="m-0">
									<strong>Expires:</strong> {new Date(item.expirationDate).toLocaleDateString()}
								</p>
							</div>
							<Button
								mt="sm"
								variant="default"
								color="white"
								size="sm"
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									setEditingItem(item)
								}}
							>
								Edit Metadata
							</Button>
						</Paper>
					))}
				</SimpleGrid>
			</section>
			<EditContentModal
				opened={!!editingItem}
				onClose={() => setEditingItem(null)}
				initialModifiedAt={editingItem?.lastModifiedDate}
				initialExpirationDate={editingItem?.expirationDate}
				initialOwner={editingItem?.owner?.name}
				onSubmit={(values) => {
					console.log(editingItem)
					const id = editingItem!.id
					setEditingItem(null)
					updateContent.mutate({
						id,
						modifiedAt: values.modifiedAt ? new Date(values.modifiedAt).toISOString() : undefined,
						expirationDate: values.expirationDate
							? new Date(values.expirationDate).toISOString()
							: undefined,
						ownerName: values.owner ?? undefined,
					})
				}}
			/>
		</div>
	)
}
