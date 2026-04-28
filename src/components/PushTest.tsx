import { Button, Flex, Paper, ScrollArea, Text, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import type { PushSubscription } from "@shared/types.ts"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type z from "zod"
import { getPushSubscription, subscribePush, unsubscribePush } from "@/lib/push.ts"
import { trpc } from "@/lib/trpc.ts"

export function PushTest() {
	const createPushSubscription = useMutation(trpc.user.createPushSubscription.mutationOptions())
	const deletePushSubscription = useMutation(trpc.user.deletePushSubscription.mutationOptions())
	const sendTestPush = useMutation(trpc.user.sendTestPush.mutationOptions())

	const [subscription, setSubscription] = useState<z.infer<typeof PushSubscription> | null>(null)

	useEffect(() => {
		getPushSubscription().then(setSubscription)
	}, [])

	async function handleSubscribe() {
		const subscription = await subscribePush()
		if (subscription) {
			await createPushSubscription.mutateAsync(subscription)
			setSubscription(subscription)
		}
	}

	async function handleUnsubscribe() {
		const subscription = await unsubscribePush()
		if (subscription) {
			await deletePushSubscription.mutateAsync({ endpoint: subscription.endpoint })
			setSubscription(null)
		}
	}

	async function handleSendTest() {
		await sendTestPush.mutateAsync()
		notifications.show({
			title: "Test Notification Sent",
			message:
				"A test notification has been sent to all of your active push subscriptions. Check your device to see it!",
			color: "green",
		})
	}

	return (
		<Paper withBorder p="md" mt="md" className="flex flex-col gap-md">
			<Title order={4}>Push Notification Test</Title>

			{subscription ? (
				<div>
					<Text className="mb-2 font-medium">Subscription</Text>
					<ScrollArea className="bg-gray-50 dark:bg-gray-800 rounded-md max-h-100">
						<pre className="m-0 p-md">{JSON.stringify(subscription, null, 2)}</pre>
					</ScrollArea>
				</div>
			) : (
				<div>No push subscription found.</div>
			)}

			{subscription ? (
				<Flex className="justify-end" gap="xs">
					<Button variant="subtle" onClick={handleSendTest} disabled={sendTestPush.isPending}>
						Send Test Notification
					</Button>
					<Button onClick={handleUnsubscribe} disabled={deletePushSubscription.isPending}>
						Unsubscribe
					</Button>
				</Flex>
			) : (
				<Button
					className="self-end"
					onClick={handleSubscribe}
					disabled={createPushSubscription.isPending}
				>
					Subscribe
				</Button>
			)}
		</Paper>
	)
}
