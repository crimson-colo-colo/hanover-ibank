import { useAuth0 } from "@auth0/auth0-react"
import { move } from "@dnd-kit/helpers"
import { DragDropProvider } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { ActionIcon, Flex, Modal, SimpleGrid, Stack, Switch, Title } from "@mantine/core"
import { useDisclosure, useLocalStorage } from "@mantine/hooks"
import type { FileType } from "@shared/filetype.ts"
import { IconDotsVertical, IconSettings } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useRef, useState } from "react"
import { AccountStatisticsModule } from "@/components/dashboard/AccountStatisticsModule.tsx"
import { ExpiringContentModule } from "@/components/dashboard/ExpiringContentModule.tsx"
import { FavoriteContentModule } from "@/components/dashboard/FavoriteContentModule.tsx"
import { PopularFilesModule } from "@/components/dashboard/PopularFilesModule.tsx"
import { PopularLinksModule } from "@/components/dashboard/PopularLinksModule.tsx"
import { RecentlyViewedModule } from "@/components/dashboard/RecentlyViewedModule.tsx"
import { PreviewModal } from "@/components/PreviewModal.tsx"
import Search from "@/components/Search.tsx"
import { employeeRoleDisplayName } from "@/lib/enums.ts"
import { trpc } from "@/lib/trpc.ts"

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: RoleDashboard,
})

const modules = [
	{
		id: "favorite-content",
		name: "Favorite Content",
		component: FavoriteContentModule,
	},
	{
		id: "recently-viewed",
		name: "Recently Viewed",
		component: RecentlyViewedModule,
	},
	{
		id: "popular-links",
		name: "Popular Links",
		component: PopularLinksModule,
	},
	{
		id: "popular-files",
		name: "Popular Files",
		component: PopularFilesModule,
	},
	{
		id: "expiring-content",
		name: "Expiring Content",
		component: ExpiringContentModule,
	},
	{
		id: "account-statistics",
		name: "Account Statistics",
		component: AccountStatisticsModule,
	},
]

type DashboardConfig = {
	modules: { id: string; enabled: boolean }[]
}

function RoleDashboard() {
	const auth0 = useAuth0()
	const profile = useQuery(trpc.user.getProfile.queryOptions())
	const [filePreviewOpen, { open: openFilePreviewModal, close: _closeFilePreview }] =
		useDisclosure(false)
	const [selectedContent, setSelectedContent] = useState<string | null>(null)
	const [selectedContentFileType, setSelectedContentFileType] = useState<FileType | null>(null)
	const [configModalOpen, { open: openConfigModal, close: closeConfigModal }] = useDisclosure(false)

	const [config, setConfig] = useLocalStorage<DashboardConfig>({
		key: "dashboard-config",
		defaultValue: {
			modules: modules.map((module) => ({ id: module.id, enabled: true })),
		},
	})

	function closeFilePreview() {
		setSelectedContent(null)
		setSelectedContentFileType(null)
		_closeFilePreview()
	}

	return (
		<main>
			<Search />

			<header className="w-full p-4 text-white rounded-lg bg-primary flex">
				<Stack gap={0} className="flex-1">
					<Title>
						Welcome,{" "}
						{auth0.user?.name ?? auth0.user?.nickname ?? auth0.user?.preferred_username ?? "User"}
					</Title>
					<small className="font-semibold tracking-wider text-gray-200 uppercase">
						{profile.data ? employeeRoleDisplayName[profile.data.role!] : ""}
					</small>
				</Stack>
				<ActionIcon size="xl" variant="transparent">
					<IconSettings size={28} onClick={openConfigModal} className="stroke-white" />
				</ActionIcon>
			</header>

			<SimpleGrid cols={2} spacing="md" mt="md">
				{config.modules
					.filter((module) => module.enabled)
					.map((module) => {
						const ModuleComponent = modules.find((m) => m.id === module.id)?.component
						if (!ModuleComponent) return null
						return (
							<ModuleComponent
								key={module.id}
								setSelectedContent={setSelectedContent}
								setSelectedContentFileType={setSelectedContentFileType}
								openFilePreviewModal={openFilePreviewModal}
							/>
						)
					})}
			</SimpleGrid>
			<Modal.Root
				opened={filePreviewOpen}
				onClose={closeFilePreview}
				fullScreen
				shadow="none"
				transitionProps={{ transition: "fade", duration: 200 }}
			>
				<Modal.Overlay backgroundOpacity={0.55} blur={3} />
				{selectedContent && selectedContentFileType && (
					<PreviewModal closePreview={closeFilePreview} contentId={selectedContent} />
				)}
			</Modal.Root>
			<Modal
				opened={configModalOpen}
				onClose={closeConfigModal}
				title="Dashboard Configuration"
				size="md"
			>
				<DashboardConfigModal config={config} setConfig={setConfig} />
			</Modal>
		</main>
	)
}

function DashboardConfigModal({
	config,
	setConfig,
}: {
	config: DashboardConfig
	setConfig: (config: DashboardConfig) => void
}) {
	return (
		<>
			<Title order={4} mb="md">
				Modules
			</Title>

			<DragDropProvider
				onDragEnd={(event) => {
					const modules = move(config.modules, event)
					setConfig({ modules })
				}}
			>
				<Stack>
					{config.modules.map((module, index) => {
						const moduleInfo = modules.find((m) => m.id === module.id)
						if (!moduleInfo) return null
						return (
							<DashboardModuleSwitch
								key={module.id}
								id={module.id}
								name={moduleInfo.name}
								enabled={config.modules.find((m) => m.id === module.id)?.enabled ?? false}
								onToggle={(id, enabled) => {
									setConfig({
										modules: config.modules.map((m) => (m.id === id ? { ...m, enabled } : m)),
									})
								}}
								index={index}
							/>
						)
					})}
				</Stack>
			</DragDropProvider>
		</>
	)
}

function DashboardModuleSwitch({
	id,
	name,
	enabled,
	onToggle,
	index,
}: {
	id: string
	name: string
	enabled: boolean
	onToggle: (id: string, enabled: boolean) => void
	index: number
}) {
	const handleRef = useRef<HTMLButtonElement>(null)
	const { ref } = useSortable({ id, index, handle: handleRef })

	return (
		<Flex align="center" ref={ref} gap="sm">
			<ActionIcon ref={handleRef} variant="subtle" size="md" className="cursor-move">
				<IconDotsVertical size={20} className="cursor-grab" />
			</ActionIcon>
			<span className="flex-1">{name}</span>
			<Switch checked={enabled} onChange={(event) => onToggle(id, event.currentTarget.checked)} />
		</Flex>
	)
}
