import { useState } from "react";
import {Avatar, Badge, Box, Button, Divider, Drawer, Group, Paper, Stack, Text, Textarea,} from "@mantine/core";
import { IconCheck, IconRefresh } from "@tabler/icons-react";
import type { Thread } from "./DiscussionPanel";

function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(date));
}

type Props = {
    opened: boolean;
    thread: Thread | null;
    onClose: () => void;
    onReply: (threadId: string, body: string) => void;
    onResolve: (threadId: string) => void;
    onReopen: (threadId: string) => void;
};

export default function ThreadDrawer({
                                         opened,
                                         thread,
                                         onClose,
                                         onReply,
                                         onResolve,
                                         onReopen,
                                     }: Props) {
    const [reply, setReply] = useState("");

    if (!thread) return null;

    const submitReply = () => {
        if (!reply.trim() || thread.status === "Archived") return;
        onReply(thread.id, reply.trim());
        setReply("");
    };

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="xl"
            title={
                <Stack gap={4}>
                    <Group gap="xs">
                        {thread.sectionLabel ? <Badge variant="outline">{thread.sectionLabel}</Badge> : null}
                        <Badge variant="light">{thread.status}</Badge>
                    </Group>
                    <Text fw={700}>{thread.title || "Untitled thread"}</Text>
                </Stack>
            }
        >
            <Stack gap="md">
                <Paper withBorder radius="xl" p="md">
                    <Group justify="space-between" align="flex-start">
                        <Box>
                            <Text size="sm">
                                Started by <strong>{thread.createdBy.name}</strong>
                            </Text>
                            <Text size="xs" c="dimmed">
                                {formatDate(thread.createdAt)}
                            </Text>
                        </Box>

                        {thread.status === "Resolved" ? (
                            <Button
                                variant="light"
                                leftSection={<IconRefresh size={16} />}
                                onClick={() => onReopen(thread.id)}
                            >
                                Reopen
                            </Button>
                        ) : thread.status === "Open" ? (
                            <Button
                                variant="light"
                                color="green"
                                leftSection={<IconCheck size={16} />}
                                onClick={() => onResolve(thread.id)}
                            >
                                Resolve
                            </Button>
                        ) : null}
                    </Group>
                </Paper>

                <Stack gap="md">
                    {thread.comments.map((comment, idx) => (
                        <div key={comment.id}>
                            <Paper withBorder radius="lg" p="md">
                                <Group align="flex-start" wrap="nowrap">
                                    <Avatar radius="xl" name={comment.author.name} />
                                    <Box style={{ flex: 1 }}>
                                        <Group justify="space-between" mb={6}>
                                            <Text fw={600} size="sm">
                                                {comment.author.name}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {formatDate(comment.createdAt)}
                                            </Text>
                                        </Group>
                                        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                                            {comment.body}
                                        </Text>
                                    </Box>
                                </Group>
                            </Paper>
                            {idx < thread.comments.length - 1 ? <Divider my="sm" variant="dashed" /> : null}
                        </div>
                    ))}
                </Stack>

                <Paper withBorder radius="xl" p="md">
                    <Stack gap="sm">
                        <Text fw={700}>Reply</Text>
                        <Textarea
                            autosize
                            minRows={4}
                            placeholder="Write a reply..."
                            value={reply}
                            onChange={(e) => setReply(e.currentTarget.value)}
                            disabled={thread.status === "Archived"}
                        />
                        <Group justify="flex-end">
                            <Button
                                onClick={submitReply}
                                disabled={!reply.trim() || thread.status === "Archived"}
                            >
                                Post reply
                            </Button>
                        </Group>
                    </Stack>
                </Paper>
            </Stack>
        </Drawer>
    );
}