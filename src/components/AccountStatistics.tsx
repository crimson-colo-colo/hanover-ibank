import { Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
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

export function Statistics() {
	const stats = useQuery(trpc.user.getStats.queryOptions())

	return (
		<Paper
			withBorder
			p="md"
			radius="md"
			className="fixed bottom-4 right-4 w-[360px] shadow-lg bg-white z-10"
		>
			<Stack gap="sm">
				<Title order={4}>Account Statistics</Title>

				{stats.isLoading ? (
					<Text c="dimmed" size="sm">
						Loading statistics...
					</Text>
				) : stats.isError || !stats.data ? (
					<Text c="red" size="sm">
						Failed to load statistics.
					</Text>
				) : (
					<SimpleGrid cols={3} spacing="sm">
						<StatBox label="Files" value={stats.data.fileCount.toString()} />
						<StatBox label="Links" value={stats.data.linkCount.toString()} />
						<StatBox
							label="Account Age"
							value={formatAccountAge(stats.data.accountCreatedAt)}
						/>
					</SimpleGrid>
				)}
			</Stack>
		</Paper>
	)
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