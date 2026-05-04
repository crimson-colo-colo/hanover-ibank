import { Treemap } from "@mantine/charts"
import { Flex, Group, Paper, SimpleGrid, Skeleton, Text, Title } from "@mantine/core"
import { FileType } from "@shared/filetype.ts"
import { IconFileSmile, IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { formatBytes } from "@/lib/content.ts"
import { trpc } from "@/lib/trpc.ts"

function formatAccountAge(createdAt: Date): string {
	const now = new Date()
	const date = new Date(createdAt)

	const ms = now.getTime() - date.getTime()
	const days = Math.floor(ms / (1000 * 60 * 60 * 24))
	const years = Math.floor(days / 365)
	const months = Math.floor((days % 365) / 30)

	if (years > 0) return `${years}y ${months}m`
	if (months > 0) return `${months}m`
	return `${days}d`
}

export function AccountStatisticsModule() {
	const stats = useQuery(trpc.user.getStats.queryOptions())

	return (
		<Paper withBorder p="md" radius="md" className="flex flex-col">
			<Group mb="sm">
				<Title order={3}>Account Statistics</Title>
				{stats.isFetching && <IconLoader2 className="animate-spin flex" size={24} />}
			</Group>

			<Skeleton visible={!stats.data}>
				<SimpleGrid cols={3} spacing="sm">
					<StatBox label="Files" value={stats.data?.fileCount.toString() ?? "..."} />
					<StatBox label="Links" value={stats.data?.linkCount.toString() ?? "..."} />
					<StatBox
						label="Account Age"
						value={formatAccountAge(stats.data?.accountCreatedAt ?? new Date())}
					/>
				</SimpleGrid>
			</Skeleton>

			{!stats.data || !Object.values(stats.data.fileStorage ?? {}).length ? (
				<div className="flex flex-col min-h-60 p-8 items-center justify-center text-center border border-dashed rounded-md border-gray-200 dark:border-gray-800 mt-md flex-1">
					<IconFileSmile size={40} strokeWidth={1} className="stroke-dimmed" />
					<Text mt="md" c="dimmed" className="text-sm text-balance">
						No files uploaded yet. Upload some files to see a breakdown of your storage usage by
						file type.
					</Text>
				</div>
			) : (
				<Treemap
					data={Object.entries(stats.data.fileStorage ?? {}).map(([group, files]) => ({
						name: group,
						color: fileTypeColors[group as FileType] ?? "gray.6",
						children: files.map((file) => ({
							name: file.name,
							size: file.size,
							fileType: group,
							color: fileTypeColors[group as FileType],
						})),
					}))}
					tooltipProps={{
						content: (props) => {
							const isVisible = props.active && props.payload && props.payload.length > 0
							return (
								<Flex
									style={{ visibility: isVisible ? "visible" : "hidden" }}
									className="bg-white dark:bg-gray-900 px-3 py-2 rounded-md shadow-sm border border-gray-200 dark:border-gray-800"
								>
									{isVisible && (
										<>
											<div
												style={{ backgroundColor: props.payload[0].payload.color as string }}
												className="w-3 h-3 rounded-full mr-3 mt-1.5 shrink-0"
											/>
											<Flex direction="column">
												<Text fw={600}>{props.payload[0].name}</Text>
												<Text c="dimmed" className="text-sm">
													{formatBytes(Math.exp(props.payload[0].value as number))}
												</Text>
											</Flex>
										</>
									)}
								</Flex>
							)
						},
					}}
					treemapProps={{
						content: (props) => (
							<>
								<rect
									x={props.x}
									y={props.y}
									width={props.width}
									height={props.height}
									fill={!props.children?.length ? (props.color as string) : "transparent"}
									className="stroke-white dark:stroke-[#242424]"
									rx={4}
									ry={4}
								/>
								<FileTypeIcon
									fileType={props.fileType as FileType}
									size={24}
									x={props.x + props.width / 2 - 12}
									y={props.y + props.height / 2 - 12}
									strokeWidth={1.5}
									className="stroke-white dark:stroke-white"
								/>
							</>
						),
					}}
					dataKey="size"
					className="flex-1 w-full relative mt-md"
				/>
			)}
		</Paper>
	)
}

const fileTypeColors: Record<FileType, string> = {
	[FileType.WordDocument]: "var(--blue-600)",
	[FileType.Powerpoint]: "var(--orange-600)",
	[FileType.Excel]: "var(--emerald-600)",
	[FileType.Pdf]: "var(--red-600)",
	[FileType.Audio]: "var(--emerald-600)",
	[FileType.Video]: "var(--red-600)",
	[FileType.Image]: "var(--sky-600)",
	[FileType.Link]: "var(--gray-600)",
	[FileType.Unknown]: "var(--gray-700)",
	[FileType.Plaintext]: "var(--pear-700)",
}

function StatBox({ label, value }: { label: string; value: string }) {
	return (
		<Paper withBorder p="sm" radius="md">
			<Text size="xs" c="dimmed" tt="uppercase" fw={600}>
				{label}
			</Text>
			<Text size="lg" fw={700}>
				{value}
			</Text>
		</Paper>
	)
}
