import {useQuery} from "@tanstack/react-query"
import {trpc} from "@/lib/trpc.ts";
import {Card, Image, Text, Skeleton, Center} from "@mantine/core"
import {useMemo} from "react";

export function URLCard({url}: { url: string }) {
    const opengraph = useQuery(trpc.opengraph.getGraphResponse.queryOptions({url: url}))

    function extractOGData(response: NonNullable<typeof opengraph.data>['response']) {
        if (!response) return null;
        return {
            title: response.ogTitle ??
                response.twitterTitle ??
                response.dcTitle ?? null,
            description: response.ogDescription ??
                response.twitterDescription ??
                response.dcDescription ?? null,
            image: response.ogImage?.at(0)?.url ??
                response.twitterImage?.at(0)?.url ?? null,
            siteName: response.ogSiteName ?? null,
            url: response.ogUrl ?? null,
            type: response.ogType ?? null,
            favicon: response.favicon ?? null,
            author: response.articleAuthor?.at(0) ?? response.dcCreator?.at(0) ?? null,
            publishedTime: response.articlePublishedTime ? new Date(response.articlePublishedTime) : null,
            // logo: response.ogImage?.at(0)?.url ?? response.twitterImage?.at(0)?.url ?? null,
        };
    }


    const graph = useMemo(() => {
        if (opengraph.isLoading || !opengraph.data) return {
            title: null,
            description: null,
            image: null,
            siteName: null,
            url: null,
            type: null,
            favicon: null,
            author: null,
            publishedTime: null,
            logo: null
        };
        return extractOGData(opengraph.data.response);
    }, [opengraph.isLoading, opengraph.data]);

    return (
        <Card shadow="md" padding="lg" style={{ maxWidth : 600}}>
            {graph ?
                <>
                {graph.image !== undefined ?
                            <Card.Section my="sm">
                                <Center>
                                {graph.image === null ?
                                    <Image mah={300} maw={300} src={"src/assets/image-not-found.png"}/> :
                                    <Image mah={300} maw={300} radius="xl" fit="contain" src={graph.image} fallbackSrc={"src/assets/image-not-found.png"}/>
                                }
                                </Center>
                            </Card.Section> : null }
                    {graph.title !== undefined ?
                        <Card.Section my="sm" >
                            <Skeleton visible={graph.title === null}>
                                <Center>
                                    <Text p={"md"} size={"lg"} fw={600}>{graph.title ?? "Bad stuff idk you shouldn't see this."}</Text>
                                </Center>
                            </Skeleton>
                        </Card.Section> : null
                    }
                    {graph.description !== undefined ?
                        <Card.Section>
                            <Center>
                                <Text p={"md"}>{graph.description ?? null}</Text>
                            </Center>
                        </Card.Section> : null
                    }
                    {

                }
                </>
                : <Text>Couldn't fetch link preview.</Text>}

        </Card>
    )

}