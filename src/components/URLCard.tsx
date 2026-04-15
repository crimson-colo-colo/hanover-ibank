import { useQuery } from "@tanstack/react-query"
import {trpc} from "@/lib/trpc.ts";
import { Card, Image, Text, Skeleton} from "@mantine/core"
import {useMemo} from "react";

export function URLCard({url}: {url: string}) {
    const opengraph = useQuery(trpc.opengraph.getGraphResponse.queryOptions({url: url}))

    const graph = useMemo(() => {
        let response
        if (opengraph.isLoading || !opengraph.data ) {
            return {
                ogImage: null, // if each individual property is null that means it hasn't loaded yet (?)
                title: null,
                description: null
            }
        } else if (!opengraph.data.response) {
            return null // if this is null then the image failed entirely
        }
        return {
            ogImage: opengraph.data.response.ogImage?.at(0)?.url,
            description: opengraph.data.response.ogDescription,
            title: opengraph.data.response.ogTitle
        }
    }, [opengraph]);

    return (
        <Card>
            {graph ?
            <>
            {/*<Card.Section>*/}
            {/*    {graph.ogImage === null ?*/}
            {/*        <Skeleton/> :*/}
            {/*        <Image>src={graph.ogImage}</Image>*/}
            {/*    }*/}
            {/*</Card.Section>*/}
            <Card.Section>
                <Skeleton visible={graph.title === null}>
                    <Text>{graph.title ?? "Bad stuff idk you shouldn't see this."}</Text>
                </Skeleton>
            </Card.Section>
            <Card.Section>
                <Skeleton visible={graph.description === null}>
                    <Text>{graph.description ?? "Bad stuff idk you shouldn't see this."}</Text>
                </Skeleton>
            </Card.Section>
            </>
: <Text>Couldn't fetch link preview.</Text>}
        </Card>
    )

}