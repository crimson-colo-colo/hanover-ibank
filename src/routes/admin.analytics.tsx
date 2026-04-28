import { AreaChart, BarChart, Heatmap, PieChart } from "@mantine/charts"
import {Button, Grid, Paper, Stack, Text, Timeline, Title } from "@mantine/core"
import { IconUserKey } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { trpc } from "@/lib/trpc.ts"

export const Route = createFileRoute("/admin/analytics")({
	component: AnalyticsDashboard,
})

function AnalyticsDashboard() {
	const { data: fileStats } = useQuery(trpc.content.getFileStats.queryOptions())

	const { data: uploadStats } = useQuery(trpc.content.getUploadStats.queryOptions())

	const { data: heatmapData } = useQuery(
		trpc.userActivity.viewActivityHeatmapWithDates.queryOptions()
	)

	const { data: userData } = useQuery(trpc.userActivity.viewRecentActivity.queryOptions())

	const { data: userStats } = useQuery(trpc.admin.getStats.queryOptions())

	const COLORS = [
		"violet.6",
		"blue.6",
		"teal.6",
		"orange.6",
		"red.6",
		"green.6",
		"pink.6",
		"cyan.6",
	]

	const barData = (fileStats ?? []).map((item) => ({
		type: item.type,
		storage: item.totalSize,
	}))

	const pieData = (fileStats ?? []).map((item, i) => ({
		name: item.type,
		value: item.count,
		color: COLORS[i % COLORS.length],
	}))

	const endDate = new Date().toISOString().slice(0, 10)
	const startDate = new Date(new Date().setMonth(new Date().getMonth() - 6))
		.toISOString()
		.slice(0, 10)

	const normalizedUploadData = (uploadStats ?? []).map((item, i) => {
		const date = new Date()
		date.setMonth(date.getMonth() - 11 + i)
		return {
			...item,
			month: date.toLocaleString("default", { month: "short", year: "2-digit" }),
		}
	})

	const totalUploads = normalizedUploadData.reduce((sum, m) => sum + m.Files + m.Links, 0)
	const totalFiles = normalizedUploadData.reduce((sum, m) => sum + m.Files, 0)
	const totalLinks = normalizedUploadData.reduce((sum, m) => sum + m.Links, 0)
	const mostActive =
		normalizedUploadData.length > 0
			? normalizedUploadData.reduce((max, m) =>
					m.Files + m.Links > max.Files + max.Links ? m : max
				)
			: { month: "-" }
	const [timeOnSite, setTimeOnSite] = useState(0)

	useEffect(() => {
		const sessionStart = parseInt(localStorage.getItem("sessionStart") ?? Date.now().toString())
		const interval = setInterval(() => {
			const elapsed = Math.floor((Date.now() - sessionStart) / 1000)
			setTimeOnSite(elapsed)
		}, 1000)
		return () => clearInterval(interval)
	}, [])

	function formatTime(seconds: number) {
		const h = Math.floor(seconds / 3600)
		const m = Math.floor((seconds % 3600) / 60)
		const s = seconds % 60
		if (h > 0) return `${h}h ${m}m`
		if (m > 0) return `${m}m ${s}s`
		return `${s}s`
	}

	const metrics = [
		{ label: "Time On Site", value: formatTime(timeOnSite) },
		{ label: "Total Uploads", value: totalUploads },
		{ label: "Files", value: totalFiles },
		{ label: "Links", value: totalLinks },
		{ label: "Top Month", value: mostActive.month },
		{ label: "Employees", value: userStats?.employeeCount ?? "-" },
	]

	function getActivityLabel(path: string): { title: string; description: string } {
		if (path.includes("content.list"))
			return { title: "Content Viewed", description: "Browsed content library" }
		if (path.includes("content.get"))
			return { title: "File Accessed", description: "Opened a file" }
		if (path.includes("content.download"))
			return { title: "File Downloaded", description: "Downloaded a file" }
		if (path.includes("content.create") || path.includes("forms.createContent"))
			return { title: "File Uploaded", description: "Uploaded new content" }
		if (path.includes("content.update") || path.includes("content.updateFile"))
			return { title: "File Edited", description: "Updated content" }
		if (path.includes("content.delete"))
			return { title: "File Deleted", description: "Deleted content" }
		if (path.includes("content.favorite"))
			return { title: "Content Favorited", description: "Marked content as favorite" }
		if (path.includes("content.unfavorite"))
			return { title: "Content Unfavorited", description: "Marked content as unfavorite" }
		if (path.includes("content.checkOut"))
			return { title: "File Checked Out", description: "Checked out a file" }
		if (path.includes("content.checkIn"))
			return { title: "File Checked In", description: "Checked in a file" }
		if (path.includes("admin.listUsers"))
			return {
				title: "Employee Management Page Viewed",
				description: "Visited employee management",
			}
		if (path.includes("admin."))
			return { title: "Analytics Dashboard Viewed", description: "Visited analytics dashboard" }
		return { title: path, description: "" }
	}

	return (
		<Stack mt="md" gap="lg">
			<Title order={2}>Analytics Dashboard</Title>

			<Button component={Link} to="/admin/activity-log" w="fit-content">
				View Activity Log
			</Button>

			<Grid align="stretch" grow={true}>
				{metrics.map((m) => (
					<Grid.Col key={m.label} span={{ base: 12, sm: 6, md: 4, lg: 2 }} align="stretch">
						<Paper withBorder p="md" radius="md">
							<Text size="xs" c="dimmed" tt="uppercase" fw={500}>
								{m.label}
							</Text>
							<Text size="xl" fw={500} mt={4}>
								{m.value}
							</Text>
						</Paper>
					</Grid.Col>
				))}
			</Grid>

			<Grid>
				<Grid.Col span={{ base: 12, md: 7 }}>
					<Paper withBorder p="md" radius="md" h="100%">
						<Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="md">
							Uploads Over Time
						</Text>
						<AreaChart
							h={220}
							data={normalizedUploadData}
							dataKey="month"
							series={[
								{ name: "Files", color: "blue" },
								{ name: "Links", color: "teal" },
							]}
							curveType="monotone"
							xAxisProps={{
								padding: { right: 20 },
							}}
						/>
					</Paper>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 5 }}>
					<Paper withBorder p="md" radius="md" h="100%">
						<Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="md">
							Recent User Activity
						</Text>
						<div style={{ maxHeight: 200, overflowY: "auto" }}>
							<Timeline active={userData?.length ?? 0} bulletSize={24} lineWidth={2}>
								{(userData ?? []).map((activity, i) => {
									const { title, description } = getActivityLabel(activity.path)
									return (
										<Timeline.Item
											// biome-ignore lint/suspicious/noArrayIndexKey: foo
											key={i}
											bullet={<IconUserKey size={12} />}
											title={title}
										>
											<Text size="sm" c="dimmed">
												{activity.contentTitle
													? `Uploaded "${activity.contentTitle}"`
													: description}
											</Text>
											<Text size="xs" mt={4}>
												{new Date(activity.timestamp).toLocaleTimeString()}
											</Text>
										</Timeline.Item>
									)
								})}
							</Timeline>
						</div>
					</Paper>
				</Grid.Col>
			</Grid>

			<Grid>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<Paper withBorder p="md" radius="md">
						<Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="md">
							File Types
						</Text>
						{pieData.length > 0 ? (
							<PieChart
								size={200}
								data={pieData}
								withTooltip
								tooltipDataSource="segment"
								withLabels
								withLabelsLine
								labelsPosition="outside"
								labelsType="value"
								className="mx-auto"
							/>
						) : (
							<Text c="dimmed" ta="center" mt="xl">
								No file data available yet
							</Text>
						)}
					</Paper>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 6 }}>
					<Paper withBorder p="md" radius="md">
						<Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="md">
							Storage Used by Type
						</Text>
						{barData.length > 0 ? (
							<BarChart
								h={300}
								data={barData}
								dataKey="type"
								valueFormatter={(value) => {
									if (value < 1024) return `${value} B`
									if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
									return `${(value / (1024 * 1024)).toFixed(1)} MB`
								}}
								series={[{ name: "storage", color: "violet.6", label: "Storage Used" }]}
							/>
						) : (
							<Text c="dimmed" ta="center" mt="xl">
								No file data available yet
							</Text>
						)}
					</Paper>
				</Grid.Col>
			</Grid>

			<Grid>
				<Grid.Col span={12}>
					<Paper withBorder p="md" radius="md">
						<Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="md">
							User Activity Heatmap
						</Text>
						<Heatmap
							data={heatmapData ?? {}}
							startDate={startDate}
							endDate={endDate}
							colors={[
								"var(--mantine-color-violet-2)",
								"var(--mantine-color-violet-3)",
								"var(--mantine-color-violet-4)",
								"var(--mantine-color-violet-5)",
							]}
							withTooltip
							withWeekdayLabels
							weekdayLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
							withMonthLabels
							firstDayOfWeek={0}
							rectSize={20}
							rectRadius={20}
							gap={5}
							getTooltipLabel={({ date, value }) =>
								`${dayjs(date).format("D MMM, YYYY")} – ${value === null || value === 0 ? "No Active Users" : `${value} Active User${value > 1 ? "s" : ""}`}`
							}
						/>
					</Paper>
				</Grid.Col>
			</Grid>
		</Stack>
	)
}
