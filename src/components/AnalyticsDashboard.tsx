import { AreaChart, BarChart } from "@mantine/charts"
import { Grid, Paper, Stack, Text, Title } from "@mantine/core"

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
		{ label: "Time On Site", value: 12 },
		{ label: "Total Uploads", value: totalUploads },
		{ label: "Files", value: totalFiles },
		{ label: "Links", value: totalLinks },
		{ label: "Top Month", value: mostActive.month },
	]

	return (
		<Stack mt="md" gap="lg">
			<Title order={2}>Analytics Dashboard</Title>

			<Grid>
				{metrics.map((m) => (
					<Grid.Col key={m.label} span={3}>
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
				<Grid.Col span={12}>
					<Paper withBorder p="md" radius="md">
						<Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="md">
							Uploads over time
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
			</Grid>

			<Grid>
				<Grid.Col span={12}>
					<Paper withBorder p="md" radius="md">
						<Text size="xs" c="dimmed" tt="uppercase" fw={500}>
							Storage Data
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
