import { Input, Text } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { trpc } from "../lib/trpc.ts"

export default function Search() {
	const [value, setValue] = useState<string | undefined>(undefined)
	const data = useQuery(
		trpc.content.search.queryOptions({ query: value ?? "History of the united states" })
	)

	async function input(string: string) {
		setValue(string)
		data.refetch({ cancelRefetch: true })
	}
	return (
		<div>
			<Input value={value} onChange={(event) => input(event.currentTarget.value)} />
			<ul>
				{data.data?.map((value) => <li key={value.id}>{value.title}</li>) ?? <Text>No work</Text>}
			</ul>
		</div>
	)
}
