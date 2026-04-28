import { Treemap } from "@mantine/charts"
import { Box, Paper, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc.ts"

const TREEMAP_COLORS = [
	"blue.6",
	"teal.6",
	"violet.6",
	"orange.6",
	"pink.6",
	"cyan.6",
	"lime.6",
	"yellow.6",
	"grape.6",
	"indigo.6",
]

function formatMimeType(mimeType: string): string {
	const subtype = mimeType.split("/")[1] ?? mimeType
	return subtype.split(/[+.;]/)[0].toUpperCase()
}

function formatAccountAge(createdAt: Date): string {
	const now = new Date()
	const ms = now.getTime() - createdAt.getTime()
	const days = Math.floor(ms / (1000 * 60 * 60 * 24))
	const years = Math.floor(days / 365)
	const months = Math.floor((days % 365) / 30)

	if (years > 0) return `${years}y${months}m`
	if (months > 0) return `${months}m`
	return `${days}d`
}

export function Statistics() {
	const stats = useQuery(trpc.user.getStats.queryOptions())

	if (stats.isLoading) {
		return (
			<Stack gap="md">
				<Title order={3}>Statistics</Title>
				<Skeleton height={200} />
				<SimpleGrid cols={3} spacing="sm">
					<Skeleton height={80} />
					<Skeleton height={80} />
					<Skeleton height={80} />
				</SimpleGrid>
			</Stack>
		)
	}

	if (stats.isError || !stats.data) {
		return (
			<Stack gap="md">
				<Title order={3}>Statistics</Title>
				<Text c="dimmed" size="sm">
					Failed to load statistics.
				</Text>
			</Stack>
		)
	}

	const treemapData = stats.data.fileTypes.map((ft, i) => ({
		name: formatMimeType(ft.mimeType),
		value: ft.totalSize,
		color: TREEMAP_COLORS[i % TREEMAP_COLORS.length],
	}))

	return (
		<Stack gap="md">
			<Title order={3}>Statistics</Title>

			<Paper withBorder p="xs" radius="md">
				{treemapData.length === 0 ? (
					<Box h={200} display="flex" style={{ alignItems: "center", justifyContent: "center" }}>
						<Text c="dimmed" size="sm">
							No files yet
						</Text>
					</Box>
				) : (
					<Treemap data={treemapData} h={200} autoContrast withTooltip />
				)}
			</Paper>

			<SimpleGrid cols={3} spacing="sm">
				<StatBox label="Files" value={stats.data.fileCount.toString()} />
				<StatBox label="Links" value={stats.data.linkCount.toString()} />
				<StatBox label="Account age" value={formatAccountAge(stats.data.accountCreatedAt)} />
			</SimpleGrid>
		</Stack>
	)
}

function StatBox({ label, value }: { label: string; value: string }) {
	return (
		<Paper withBorder p="md" radius="md">
			<Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
				{label}
			</Text>
			<Text size="xl" fw={700}>
				{value}
			</Text>
		</Paper>
	)
}
