import { Flex, Paper, SimpleGrid } from "@mantine/core"
import { IconFile, IconLink } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { formatBytes, getContentTarget } from "@/lib/content.ts"
import { trpc } from "@/lib/trpc.ts"

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: RoleDashboard,
})

function RoleDashboard() {
	const auth0 = useAuth0()
	const content = useQuery(trpc.content.list.queryOptions())

	return (
		<main>
			<header className="w-full bg-primary-hover text-white p-4 rounded-xl">
				<h1 className="m-0 -mb-1">Welcome, Alice</h1>
				<small className="uppercase tracking-wider text-gray-300 font-semibold mb-3">
					Business Analyst
				</small>
			</header>

			<div>
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
								<p className="text-sm text-gray-600 mt-1 mb-2">
									{item.type === "Link"
										? new URL(item.url!).hostname
										: formatBytes(content.data?.objectMetadata.get(item.id)?.size || 0)}
								</p>
								<div className="text-sm text-gray-700 space-y-1">
									<p className="m-0">
										<strong>Owner:</strong> <span title={item.owner.email}>{item.owner.name}</span>
									</p>
									<p className="m-0">
										<strong>Last Modified:</strong>{" "}
										{new Date(item.lastModifiedDate).toLocaleString()}
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

		</main>
	)
}
