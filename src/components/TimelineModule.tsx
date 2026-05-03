import { ActionIcon, Flex, Group, Paper, Text, Timeline, Tooltip } from "@mantine/core"
import { activityLabelToStringTimeline } from "@shared/activityLabels.ts"
import { IconSearch } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { Avatar } from "@/components/Avatar.tsx"
import { trpc } from "@/lib/trpc.ts"
import { EmployeeSearch } from "./EmployeeSearch.tsx"

export function TimelineModule() {
	const [employeeID, setEmployeeID] = useState<string | undefined>(undefined)

	const { data: allUserActivity } = useQuery(
		trpc.activityLogging.listUserActivity.queryOptions({ employeeId: employeeID })
	)
	const [searching, setSearching] = useState(false)

	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (searching) {
			inputRef.current?.focus()
		}
	}, [searching])

	return (
		<Paper withBorder p="md" radius="md" h="100%">
			<Group gap={6} justify="space-between">
				<Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="md">
					Recent User Activity
				</Text>
				{searching ? (
					<EmployeeSearch
						onSubmit={setEmployeeID}
						setSearching={setSearching}
						inputRef={inputRef}
					/>
				) : (
					<ActionIcon
						variant="subtle"
						mb="md"
						onClick={() => {
							setSearching(!searching)
						}}
					>
						<IconSearch size={22} />
					</ActionIcon>
				)}
			</Group>
			<div style={{ maxHeight: 200, overflowY: "auto" }}>
				<Timeline active={allUserActivity?.length ?? 0} bulletSize={24} lineWidth={2}>
					{allUserActivity?.map((item, i) => {
						const title = activityLabelToStringTimeline[item.action]
						return (
							<Timeline.Item // biome-ignore lint/suspicious/noArrayIndexKey: foo
								key={i}
								bullet={<Avatar userId={item.employeeId} />}
								title={title}
							>
								<Flex gap={6} align="center" wrap="nowrap">
									<Text size="sm" c="dimmed" style={{ flexShrink: 0 }} className="truncate">
										{item.displayName}
									</Text>
									{item.contentTitle !== "" && (
										<>
											<Text c="dimmed" className="text-sm">
												·
											</Text>
											<Tooltip label={item.contentTitle} withArrow arrowSize={8} openDelay={300}>
												<Text c="dimmed" className="text-sm truncate">
													{item.contentTitle}
												</Text>
											</Tooltip>
										</>
									)}
								</Flex>
								<Text size="xs" mt={4}>
									{new Date(item.timestamp).toLocaleString()}
								</Text>
							</Timeline.Item>
						)
					})}
				</Timeline>
			</div>
			<Link
				to="/admin/activity-log"
				className="no-underline text-inherit flex items-center gap-2 w-fit hover:underline mt-sm"
			>
				<Text size="xs" c="dimmed" tt="uppercase" fw={500}>
					View More
				</Text>
			</Link>
		</Paper>
	)
}
