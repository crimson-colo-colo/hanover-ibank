import { Stack, Text, Title } from "@mantine/core"
import type { ContentListItem } from "../../server/routers/content.ts"
import {useQuery} from "@tanstack/react-query";
import {trpc} from "@/lib/trpc.ts";
import DocViewer, {
	DocViewerRenderers,
	PDFRenderer,
	PNGRenderer
} from "@iamjariwala/react-doc-viewer"
import "@iamjariwala/react-doc-viewer/dist/index.css"
import {useMemo} from "react";

export function FileViewer({ content }: { content: ContentListItem }) {
	const fileURL = useQuery(trpc.content.download.queryOptions({ id: content.id }))
	const document = useMemo(() => {
		if (fileURL.data)
			return[{
				uri: window.location.origin + fileURL.data.url
			}]
		else return []
	}, [fileURL.data?.url]);
	//console.log(fileURL)
	// https://react-pdf.org/components#pdfviewer
	return (

		<Stack gap="sm">
			{fileURL.isSuccess && document !== undefined?
				<DocViewer
				documents={document}
				pluginRenderers={DocViewerRenderers}
				//style={{ height: "80vh"	}}
			/>
				:
				<Text>Failed to fetch</Text>
			}
			<Title order={3}>{content.title} </Title>

			<Text>
				<b>ID:</b> {content.id}
			</Text>

			<Text>
				<b>Type:</b>
				{content.type}
			</Text>
			<Text>
				<b>Owner: </b>
				{content.owner.name}
			</Text>
			<Text>
				<b>Status: </b>
				{content.status}
			</Text>
		</Stack>

	)
}
