import { Image, Paper, Skeleton, Text } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import clsx from "clsx"
import type { OgObject } from "open-graph-scraper/types"
import { useMemo } from "react"
import imageNotFound from "@/assets/image-not-found.png"
import { trpc } from "@/lib/trpc.ts"

export function URLCard({ url }: { url: string }) {
	const opengraph = useQuery(trpc.opengraph.getOpenGraph.queryOptions({ url: url }))

	function extractOGData(response: OgObject | null) {
		if (!response) return null
		return {
			title: response.ogTitle ?? response.twitterTitle ?? response.dcTitle ?? null,
			description:
				response.ogDescription ?? response.twitterDescription ?? response.dcDescription ?? null,
			image: response.ogImage?.at(0)?.url ?? response.twitterImage?.at(0)?.url ?? null,
			siteName: response.ogSiteName ?? null,
			url: response.ogUrl ?? null,
			type: response.ogType ?? null,
			favicon: response.favicon ?? null,
			author: response.articleAuthor?.at(0) ?? response.dcCreator?.at(0) ?? null,
			publishedTime: response.articlePublishedTime ? new Date(response.articlePublishedTime) : null,
			// logo: response.ogImage?.at(0)?.url ?? response.twitterImage?.at(0)?.url ?? null,
		}
	}

	const og = useMemo(() => {
		if (opengraph.isFetching || !opengraph.data)
			return {
				title: null,
				description: null,
				image: null,
				siteName: null,
				url: null,
				type: null,
				favicon: null,
				author: null,
				publishedTime: null,
				logo: null,
			}
		return extractOGData(opengraph.data.response)
	}, [opengraph.isFetching, opengraph.data])

	return (
		<Paper shadow="sm" p="xl" maw="800" className="flex gap-xl z-1 w-full flex-col @xl:flex-row">
			{og ? (
				<>
					{opengraph.isFetching ? (
						<Skeleton height="200px" width="200px" className="rounded-lg size-50 shrink-0" />
					) : og.image == null ? (
						<Image
							unstyled
							height="200"
							width="200"
							className="object-cover rounded-lg size-50 shrink-0"
							src={imageNotFound}
						/>
					) : (
						<Image
							unstyled
							height="200"
							width="200"
							alt=""
							className="object-cover rounded-lg size-50 shrink-0"
							src={og.image}
							fallbackSrc={imageNotFound}
						/>
					)}
					<div className="flex-1 grow flex flex-col gap-md">
						<a
							className="hover:underline text-inherit no-underline"
							href={url}
							target="_blank"
							rel="noopener noreferrer"
						>
							{opengraph.isFetching ? (
								<Skeleton>
									<Text size="lg" fw={600}>
										{"watermelon ".repeat(5)}
									</Text>
								</Skeleton>
							) : (
								<Text
									size="lg"
									fw={600}
									className={clsx("line-clamp-2", og.title ? "" : "truncate")}
								>
									{og.title ?? url}
								</Text>
							)}
						</a>
						{opengraph.isFetching ? (
							<Skeleton>
								<Text>{"watermelon ".repeat(15)}</Text>
							</Skeleton>
						) : og.description ? (
							<Text className="whitespace-pre-wrap">{og.description}</Text>
						) : (
							<Text c="dimmed">No description available</Text>
						)}
					</div>
				</>
			) : (
				<Text c="dimmed">Link preview unavailable</Text>
			)}
		</Paper>
	)
}
