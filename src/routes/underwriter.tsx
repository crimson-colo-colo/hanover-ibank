import { Flex, Paper, SimpleGrid } from "@mantine/core"
import { IconFile, IconLink } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { formatBytes, getContentTarget } from "@/lib/content.ts"
import { trpc } from "@/lib/trpc.ts"

export const Route = createFileRoute("/underwriter")({
	component: RouteComponent,
})

function RouteComponent() {
	const content = useQuery(trpc.content.list.queryOptions({ role: "Underwriter" }))

	return (
		<div>
			<header className="w-full bg-primary-hover text-white p-4 rounded-xl">
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
								{item.type === "Link"
									? new URL(item.url!).hostname
									: formatBytes(content.data?.objectMetadata.get(item.id)?.size || 0)}
							</p>
						</Paper>
					))}
				</SimpleGrid>
			</section>
		</div>
	)
}
