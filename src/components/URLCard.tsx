import { Card, Center, Image, Skeleton, Text } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
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
		if (opengraph.isLoading || !opengraph.data)
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
	}, [opengraph.isLoading, opengraph.data])

	return (
		<Card shadow="md" padding="lg" style={{ maxWidth: 600 }}>
			{og ? (
				<>
					{og.image !== undefined ? (
						<Card.Section my="sm">
							<Center>
								{og.image === null ? (
									<Image mah={300} maw={300} src={imageNotFound} />
								) : (
									<Image
										mah={300}
										maw={300}
										radius="xl"
										fit="contain"
										src={og.image}
										fallbackSrc={imageNotFound}
									/>
								)}
							</Center>
						</Card.Section>
					) : null}
					{og.title !== undefined ? (
						<Card.Section my="sm">
							<Skeleton visible={og.title === null}>
								<Center>
									<Text p={"md"} size={"lg"} fw={600}>
										{og.title ?? "Bad stuff idk you shouldn't see this."}
									</Text>
								</Center>
							</Skeleton>
						</Card.Section>
					) : null}
					{og.description !== undefined ? (
						<Card.Section>
							<Center>
								<Text p={"md"}>{og.description ?? null}</Text>
							</Center>
						</Card.Section>
					) : null}
					{}
				</>
			) : (
				<Text>Couldn't fetch link preview.</Text>
			)}
		</Card>
	)
}
