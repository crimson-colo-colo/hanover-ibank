import { useAuth0 } from "@auth0/auth0-react"
import { Button, Group, Loader, Stack, Switch, Text, TextInput, Title } from "@mantine/core"
import { schemaResolver, useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconCamera, IconDeviceFloppy, IconMoon, IconSun } from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import z from "zod"
import { Avatar } from "@/components/Avatar.tsx"
import { getPushSubscription, subscribePush, unsubscribePush } from "@/lib/push.ts"
import { queryClient, trpc } from "@/lib/trpc.ts"
import { useColorScheme } from "@/lib/useColorScheme.ts"

const schema = z.object({
	name: z.string().min(3).max(100),
	email: z.email(),
	username: z.string().min(3).max(100),
	emailNotifications: z.boolean(),
	pushNotifications: z.boolean(),
})

export function ProfilePage() {
	const { user, getAccessTokenSilently } = useAuth0()
	const navigate = useNavigate()
	const avatarInputRef = useRef<HTMLInputElement>(null)
	const { colorScheme, toggleColorScheme } = useColorScheme()
	const [pushSubscription, setPushSubscription] = useState<z.infer<typeof PushSubscription> | null>(
		null
	)
	const profileQuery = useQuery(trpc.user.getProfile.queryOptions())
	const [subscribePending, setSubscribePending] = useState(false)

	useEffect(() => {
		getPushSubscription().then(setPushSubscription)
	}, [])

	async function handleSubscribePush() {
		setSubscribePending(true)
		await subscribePush()
		const sub = await getPushSubscription()
		setPushSubscription(sub)
		setSubscribePending(false)
	}

	async function handleUnsubscribePush() {
		setSubscribePending(true)
		unsubscribePush()
		setPushSubscription(null)
		setSubscribePending(false)
	}

	const updateProfile = useMutation(
		trpc.user.updateProfile.mutationOptions({
			async onSuccess() {
				await queryClient.invalidateQueries({
					queryKey: trpc.user.getAvatarUrl.queryKey({ userId: user!.sub! }),
				})
			},
		})
	)
	const uploadAvatar = useMutation(
		trpc.user.uploadAvatar.mutationOptions({
			async onSuccess() {
				await queryClient.invalidateQueries({
					queryKey: trpc.user.getAvatarUrl.queryKey({ userId: user!.sub! }),
				})
			},
		})
	)

	const form = useForm<z.input<typeof schema>, z.infer<typeof schema>>({
		initialValues: {
			name: user!.name!,
			email: user!.email!,
			username: "",
			emailNotifications: true,
			pushNotifications: true,
		},
		validate: schemaResolver(schema, { sync: true }),
		transformValues: schema.parse,
	})

	useEffect(() => {
		if (profileQuery.data) {
			form.setValues({
				name: profileQuery.data.name,
				username: profileQuery.data.username,
				email: profileQuery.data.email,
				emailNotifications: profileQuery.data.emailNotifications,
				pushNotifications: profileQuery.data.pushNotifications,
			})
		}
	}, [profileQuery.data])

	async function refreshIdToken() {
		await getAccessTokenSilently({ cacheMode: "off" })
	}

	async function onSubmit(values: {
		name: string
		email: string
		username: string
		emailNotifications: boolean
		pushNotifications: boolean
	}) {
		const result = await updateProfile.mutateAsync(values)
		if (result.error) {
			notifications.show({
				title: "Failed to update profile",
				message: result.error,
				color: "red",
			})
		} else {
			await refreshIdToken()
			notifications.show({
				title: "Profile updated",
				message: "Your profile has been updated.",
				color: "green",
			})
		}
	}

	async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files
		if (!files || files.length === 0) return
		const file = files[0]

		if (file.size > 10 * 1024 * 1024) {
			notifications.show({
				title: "File too large",
				message: "Avatar must be less than 10 MB",
				color: "red",
			})
			return
		}

		const data = new Uint8Array(await file.arrayBuffer()).toBase64()
		await uploadAvatar.mutateAsync({ file: data })
		await refreshIdToken()
		await profileQuery.refetch()
		notifications.show({
			title: "Avatar updated",
			message: "Your profile picture has been updated.",
			color: "green",
		})
	}

	return (
		<Stack
			maw={480}
			mx="auto"
			mt="md"
			gap="xl"
			className="border px-6 py-6 rounded-md border-gray-300 dark:border-gray-800"
		>
			<Group justify="space-between" align="center">
				<Title order={2}>Profile</Title>
				<Button
					variant="subtle"
					color="gray"
					onClick={toggleColorScheme}
					leftSection={
						colorScheme === "dark" ? (
							<IconSun size={16} stroke={1.5} />
						) : (
							<IconMoon size={16} stroke={1.5} />
						)
					}
				>
					{colorScheme === "dark" ? "Light mode" : "Dark mode"}
				</Button>
			</Group>

			<Group align="center" gap="md">
				<div style={{ position: "relative", display: "inline-block" }}>
					<Avatar userId={user!.sub!} w={80} h={80} />
					<Button
						unstyled
						onClick={() => avatarInputRef.current?.click()}
						style={{
							position: "absolute",
							bottom: 0,
							right: 0,
							width: 26,
							height: 26,
							borderRadius: "50%",
							background: "var(--mantine-color-body)",
							border: "1.5px solid var(--mantine-color-default-border)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
						aria-label="Upload new avatar"
						className="cursor-pointer"
					>
						{uploadAvatar.isPending ? <Loader size={12} /> : <IconCamera size={13} stroke={1.5} />}
					</Button>
					<input
						ref={avatarInputRef}
						type="file"
						accept="image/*"
						style={{ display: "none" }}
						onChange={onAvatarChange}
					/>
				</div>
				<Stack gap={2}>
					<p
						style={{
							margin: 0,
							fontWeight: 500,
						}}
					>
						{user?.name}
					</p>
					<p style={{ margin: 0, fontSize: 14, color: "var(--mantine-color-dimmed)" }}>
						{user?.email}
					</p>
				</Stack>
			</Group>

			<form onSubmit={form.onSubmit(onSubmit)}>
				<Stack gap="sm">
					<Title order={4}>Profile Information</Title>
					<TextInput
						label="Full name"
						placeholder="John Doe"
						key={form.key("name")}
						{...form.getInputProps("name")}
					/>
					<TextInput
						label="Username"
						placeholder="johndoe"
						key={form.key("username")}
						{...form.getInputProps("username")}
					/>
					<TextInput
						label="Email"
						value={profileQuery.data?.email ?? user?.email ?? ""}
						key={form.key("email")}
						{...form.getInputProps("email")}
					/>
					<Title order={4} mt="sm" mb="xs">
						Notification Preferences
					</Title>

					<Switch
						label="Enable Push Notifications"
						{...form.getInputProps("pushNotifications", { type: "checkbox" })}
					/>
					<Switch
						label="Enable Email Notifications"
						{...form.getInputProps("emailNotifications", { type: "checkbox" })}
					/>

					<Group justify="flex-end" mt="md">
						<Button variant="subtle" color="gray" onClick={() => navigate({ to: "/" })}>
							Cancel
						</Button>
						<Button
							type="submit"
							leftSection={<IconDeviceFloppy size={16} stroke={1.5} />}
							loading={updateProfile.isPending}
						>
							Save changes
						</Button>
					</Group>
				</Stack>
			</form>

			<Stack gap="sm" mt="md">
				<Title order={4}>This Browser</Title>

				{pushSubscription ? (
					<>
						<Text>Push notifications are enabled in this browser.</Text>
						<Button
							variant="outline"
							color="red"
							onClick={handleUnsubscribePush}
							loading={subscribePending}
						>
							Unsubscribe this browser
						</Button>
					</>
				) : (
					<>
						<Text>Push notifications are not enabled in this browser.</Text>
						<Button variant="outline" onClick={handleSubscribePush} loading={subscribePending}>
							Enable push notifications
						</Button>
					</>
				)}
			</Stack>
		</Stack>
	)
}
