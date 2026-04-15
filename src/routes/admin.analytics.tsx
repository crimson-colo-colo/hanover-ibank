import { createFileRoute } from "@tanstack/react-router"
import { Grid, Paper, Stack, Text, Timeline, Title} from "@mantine/core";
import {AreaChart, BarChart} from "@mantine/charts";
import {IconFolderOpen, IconPencil, IconUpload, IconUserKey} from "@tabler/icons-react";

export const Route = createFileRoute("/admin/analytics")({
	component: AnalyticsDashboard,
})
export function AnalyticsDashboard() {

	const uploadData = [
		{ month: "Jan", Files: 2, Links: 4 },
		{ month: "Feb", Files: 1, Links: 5 },
		{ month: "Mar", Files: 3, Links: 1 },
		{ month: "Apr", Files: 6, Links: 1 },
		{ month: "May", Files: 1, Links: 2 },
		{ month: "Jun", Files: 3, Links: 7 },
		{ month: "Jul", Files: 3, Links: 9 },
		{ month: "Aug", Files: 8, Links: 0 },
		{ month: "Sep", Files: 6, Links: 4 },
		{ month: "Oct", Files: 7, Links: 5 },
		{ month: "Nov", Files: 4, Links: 2 },
		{ month: "Dec", Files: 2, Links: 3 },
	]

	const totalUploads = uploadData.reduce((sum, m) => sum + m.Files + m.Links, 0)
	const totalFiles = uploadData.reduce((sum, m) => sum + m.Files, 0)
	const totalLinks = uploadData.reduce((sum, m) => sum + m.Links, 0)
	const mostActive = uploadData.reduce((max, m) =>
		m.Files + m.Links > max.Files + max.Links ? m : max
	)

	const fileTypes = [
		{ name: "DOCX", Amount: 15 },
		{ name: "PDF", Amount: 6 },
		{ name: "JPEG", Amount: 8 },
		{ name: "PNG", Amount: 3 },
	]

	const metrics = [
		{ label: "Time On Site", value: "12h" },
		{ label: "Total Uploads", value: totalUploads },
		{ label: "Files", value: totalFiles },
		{ label: "Links", value: totalLinks },
		{ label: "Top Month", value: mostActive.month },
		{ label: "Employees", value: 14 },
	]

	return (
		<Stack mt="md" gap="lg">
			<Title order={2}>Analytics Dashboard</Title>

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
							data={uploadData}
							dataKey="month"
							series={[
								{ name: "Files", color: "blue" },
								{ name: "Links", color: "teal" },
							]}
							curveType="monotone"
						/>
					</Paper>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 5 }}>
					<Paper withBorder p="md" radius="md" h="100%">
						<Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="md">
							Recent User Activity
						</Text>

						<Timeline active={3} bulletSize={24} lineWidth={2}>
							<Timeline.Item bullet={<IconUserKey size={12} />} title="User logged in">
								<Text size="sm" c="dimmed">
									Michael Jordan signed into the dashboard
								</Text>
								<Text size="xs" mt={4}>
									9:00 AM
								</Text>
							</Timeline.Item>

							<Timeline.Item bullet={<IconFolderOpen size={12} />} title="File accessed">
								<Text size="sm" c="dimmed">
									Opened Quarterly_Report.pdf
								</Text>
								<Text size="xs" mt={4}>
									9:12 AM
								</Text>
							</Timeline.Item>

							<Timeline.Item bullet={<IconPencil size={12} />} title="File edited">
								<Text size="sm" c="dimmed">
									Updated Budget_Plan.xlsx
								</Text>
								<Text size="xs" mt={4}>
									9:25 AM
								</Text>
							</Timeline.Item>

							<Timeline.Item bullet={<IconUpload size={12} />} title="File uploaded">
								<Text size="sm" c="dimmed">
									Uploaded DesignMockup.png
								</Text>
								<Text size="xs" mt={4}>
									9:40 AM
								</Text>
							</Timeline.Item>
						</Timeline>
					</Paper>
				</Grid.Col>
			</Grid>

			<Grid>
				<Grid.Col span={12}>
					<Paper withBorder p="md" radius="md">
						<Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="md">
							File Types
						</Text>
						<BarChart
							h={300}
							data={fileTypes}
							dataKey="name"
							series={[{ name: "Amount", color: "violet.6" }]}
						/>
					</Paper>
				</Grid.Col>
			</Grid>
		</Stack>
	)
}
