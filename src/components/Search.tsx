import { Input, Text } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { trpc } from "../lib/trpc.ts"

export default function Search() {
	const [value, setValue] = useState("")
	const [debouncedValue] = useDebouncedValue(value, 250)
	const data = useQuery(
		trpc.content.search.queryOptions(
			{ query: debouncedValue || "History of the united states" },
			{ enabled: true }
		)
	)

	return (
		<div>
			<Input value={value} onChange={(event) => setValue(event.currentTarget.value)} />
			<ul>
				{data.data?.map((value) => <li key={value.id}>{value.title}</li>) ?? <Text>No work</Text>}
			</ul>
		</div>
	)
}
