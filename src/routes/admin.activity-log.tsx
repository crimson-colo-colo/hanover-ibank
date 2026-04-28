import { Table, Title, Text, Paper, Stack } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { trpc } from "@/lib/trpc"

export const Route = createFileRoute("/admin/activity-log")({
    component: ActivityLogPage,
})

function ActivityLogPage() {
    const { data, isLoading, isError } = useQuery(
        trpc.admin.getActivityLogs.queryOptions()
    )

    if (isLoading) return <Text>Loading...</Text>
    if (isError) return <Text>Error loading logs</Text>

    return (
        <Stack>
            <Title order={2}>Activity Log</Title>

            <Paper withBorder p="md">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>User</Table.Th>
                            <Table.Th>Action</Table.Th>
                            <Table.Th>Entity</Table.Th>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Time</Table.Th>
                        </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                        {data?.map((log) => (
                            <Table.Tr key={log.id}>
                                <Table.Td>{log.employeeId}</Table.Td>
                                <Table.Td>{log.action}</Table.Td>
                                <Table.Td>{log.entity}</Table.Td>
                                <Table.Td>{log.entityId}</Table.Td>
                                <Table.Td>
                                    {new Date(log.createdAt).toLocaleString()}
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Paper>
        </Stack>
    )
}