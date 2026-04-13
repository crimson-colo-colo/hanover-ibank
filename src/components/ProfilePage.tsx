import { useAuth0 } from "@auth0/auth0-react"
import { Button, Group, Loader, Stack, TextInput, Title } from "@mantine/core"
import { schemaResolver, useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconCamera, IconDeviceFloppy } from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useRef } from "react"
import z from "zod"
import { Avatar } from "@/components/Avatar.tsx"
import { trpc } from "@/lib/trpc.ts"
import { IconMoon, IconSun } from "@tabler/icons-react"
import { useColorScheme } from "@/lib/useColorScheme.ts";

const schema = z.object({
	name: z.string().min(3).max(100),
	email: z.email(),
	username: z.string().min(3).max(100),
})

export function ProfilePage() {
	const { user, getAccessTokenSilently } = useAuth0()
	const navigate = useNavigate()
	const avatarInputRef = useRef<HTMLInputElement>(null)
	const { colorScheme, toggleColorScheme } = useColorScheme()

	const profileQuery = useQuery(trpc.user.getProfile.queryOptions())

	const updateProfile = useMutation(trpc.user.updateProfile.mutationOptions())
	const uploadAvatar = useMutation(trpc.user.uploadAvatar.mutationOptions())

	const form = useForm<z.input<typeof schema>, z.infer<typeof schema>>({
		initialValues: {
			name: user!.name!,
			email: user!.email!,
			username: "",
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
			})
		}
	}, [profileQuery.data])

	async function refreshIdToken() {
		await getAccessTokenSilently({ cacheMode: "off" })
	}

	async function onSubmit(values: { name: string; email: string; username: string }) {
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
		<Stack maw={480} mx="auto" mt="md" gap="xl">

			<Group justify="space-between" align="center">
				<Title order={2}>Profile</Title>
				<Button
					variant="subtle"
					color="gray"
					onClick={toggleColorScheme}
					leftSection={
					colorScheme === "dark"
						? <IconSun size={16} stroke={1.5} />
						: <IconMoon size={16} stroke={1.5} />
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
		</Stack>
	)
}
