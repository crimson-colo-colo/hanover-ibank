import { Flex, Paper, SimpleGrid } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconFile, IconLink } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import clsx from "clsx"
import { useState } from "react"
import { formatBytes } from "@/lib/content.ts"
import { trpc, trpcClient } from "@/lib/trpc.ts"

export const Route = createFileRoute("/_authenticated/underwriter")({
	component: RouteComponent,
})

function RouteComponent() {
	const content = useQuery(trpc.content.list.queryOptions({ role: "Underwriter" }))
	const [downloadingContentId, setDownloadingContentId] = useState<string | null>(null)

	return (
		<div>
			<header className="w-full bg-primary text-white p-4 rounded-xl">
				<h1 className="m-0 -mb-1">Welcome, Bob</h1>
				<small className="uppercase tracking-wider text-gray-300 font-semibold mb-3">
					Underwriter
				</small>
			</header>

			<section>
				<h2 className="mt-6 mb-4 text-xl font-semibold">Content</h2>
				<SimpleGrid minColWidth={250}>
					{content.data?.content.map((item) => (
						<Paper
							{...(item.type === "Link"
								? { component: "a", target: "_blank", href: item.url! }
								: {
										component: "button",
										onClick: async () => {
											setDownloadingContentId(item.id)
											try {
												const { url } = await trpcClient.content.download.query({ id: item.id })
												window.open(url, "_blank")
												setDownloadingContentId(null)
											} catch (error) {
												notifications.show({
													title: "Failed to download content",
													message:
														error instanceof Error ? error.message : "An unknown error occurred",
													color: "red",
												})
												setDownloadingContentId(null)
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
									<strong>Owner:</strong> {item.owner.id}
								</p>
								<p className="m-0">
									<strong>Last Modified:</strong> {new Date(item.lastModifiedDate).toLocaleString()}
								</p>
								<p className="m-0">
									<strong>Expires:</strong> {new Date(item.expirationDate).toLocaleDateString()}
								</p>
							</div>
						</Paper>
					))}
				</SimpleGrid>
			</section>
		</div>
	)
}
