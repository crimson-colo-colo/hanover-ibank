import { useAuth0 } from "@auth0/auth0-react"
import { Flex, Group, Kbd, Pill, Text } from "@mantine/core"
import { Spotlight } from "@mantine/spotlight"
import { ContentStatus, ContentType, type EmployeeRole, TagCategory } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"
import type { ContentListItem } from "@shared/types.ts"
import {
	IconCircleCheck,
	IconFile,
	IconLink,
	IconMessageCircleUser,
	IconProgress,
	IconSearch,
	IconStar,
	IconStarFilled,
	IconTag,
} from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import clsx from "clsx"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import {
	contentTypeDisplayName,
	employeeRoleDisplayName,
	fileTypeDisplayName,
	tagCategoryDisplayName,
} from "@/lib/enums.ts"
import { type SearchFilter, SearchWorker } from "@/lib/search.worker.ts"
// import * as Comlink from "comlink"
// import searchWorkerUrl from "@/lib/search.worker.ts?url"

export function AppSpotlight() {
	const auth0 = useAuth0()
	const [query, setQuery] = useState("")
	// const worker = useRef<Comlink.Remote<SearchWorker> | null>(null)
	const [items, setItems] = useState<React.ReactNode[]>([])
	const [filters, setFilters] = useState<SearchFilter[]>([])

	const worker = useRef<SearchWorker | null>(null)

	useEffect(() => {
		const w = new SearchWorker(() => auth0.getAccessTokenSilently())
		worker.current = w
	}, [])

	// useEffect(() => {
	// 	if (!auth0.isAuthenticated) return
	// 	const w = new Worker(searchWorkerUrl, { type: "module" })
	// 	const RemoteSearchWorker = Comlink.wrap<typeof SearchWorker>(w)
	// 	async function initWorker() {
	// 		const getAccessToken = Comlink.proxy(() => auth0.getAccessTokenSilently())
	// 		const instance = await new RemoteSearchWorker(getAccessToken)
	// 		worker.current = instance
	// 	}
	// 	initWorker()
	// 	return () => {
	// 		RemoteSearchWorker[Comlink.releaseProxy]()
	// 		w.terminate()
	// 	}
	// }, [auth0.isAuthenticated])

	useEffect(() => {
		if (worker.current) {
			worker.current.setFilters(filters)
		}
	}, [filters])

	useEffect(() => {
		async function search() {
			if (query.trim() === "") {
				setItems([])
				return
			}
			if (!worker.current) return

			const results = await worker.current.search(query)

			setItems(
				results.map((item) =>
					"title" in item ? (
						<SearchResult item={item} key={item.id} />
					) : (
						<SearchFilterResult
							filter={item}
							key={item.id}
							onSelect={() => {
								setFilters((prev) => {
									if (prev.some((f) => f.id === item.id)) {
										return prev.filter((f) => f.id !== item.id)
									} else {
										return [...prev, item]
									}
								})
								setQuery("")
							}}
						/>
					)
				)
			)
		}

		search()
	}, [worker, query])

	return (
		<Spotlight.Root query={query} onQueryChange={setQuery}>
			<Spotlight.Search
				placeholder="Search..."
				leftSection={<IconSearch size={20} />}
				onKeyDown={(e) => {
					if (e.key === "Backspace" && e.ctrlKey && query === "") {
						setFilters((prev) => prev.slice(0, -1))
					}
				}}
			/>
			<Flex
				mx="md"
				direction={filters.length >= 3 ? "column" : "row"}
				mb="md"
				justify="space-between"
				className={clsx(!filters.length && "hidden")}
			>
				<Group gap={4}>
					{filters.map((filter) => (
						<Pill
							key={filter.id}
							size="sm"
							color="gray"
							withRemoveButton
							onRemove={() => setFilters((prev) => prev.filter((f) => f.id !== filter.id))}
						>
							{filterDisplayConfig(filter).pill}
						</Pill>
					))}
				</Group>
				<Text size="xs" c="dimmed" className="self-end mt-1">
					<Kbd>Ctrl</Kbd> <Kbd>Bksp</Kbd> to clear last filter
				</Text>
			</Flex>
			<Spotlight.ActionsList>
				{items.length > 0 ? (
					items
				) : (
					<Spotlight.Empty>
						{query === "" ? "Type to search..." : "No results found"}
					</Spotlight.Empty>
				)}
			</Spotlight.ActionsList>
		</Spotlight.Root>
	)
}

function SearchResult({ item }: { item: ContentListItem }) {
	const navigate = useNavigate()
	return (
		<Spotlight.Action
			key={item.id}
			onClick={() => {
				navigate({ to: `/preview/${item.id}` })
			}}
		>
			<Flex gap="sm">
				<FileTypeIcon
					fileType={
						item.type === ContentType.Link
							? FileType.Link
							: (item.object.Metadata?.filetype as FileType)
					}
					size={24}
					strokeWidth={1.5}
					className="shrink-0 mt-1"
				/>
				<Flex direction="column" gap={4}>
					<Text>
						{item.title}
						{item.favorited && <IconStarFilled className="ml-2 fill-[#f8de1f]" size={16} />}
					</Text>
					<Group gap={4}>
						{item.tags.map((tag) => (
							<Pill key={`${tag.category}-${tag.name}`} size="xs" color="gray">
								{tag.category === TagCategory.IntendedAudience
									? employeeRoleDisplayName[tag.name as EmployeeRole]
									: tag.name}
							</Pill>
						))}
					</Group>
				</Flex>
			</Flex>
		</Spotlight.Action>
	)
}

function filterDisplayConfig(filter: SearchFilter): {
	icon: (props: { size: number; strokeWidth: number; className: string }) => React.ReactNode
	name: string
	description: string
	pill: React.ReactNode
} {
	if (filter.type === "favorited") {
		return {
			icon: IconStar,
			name: "Favorited",
			description: "Only show favorited content",
			pill: (
				<>
					<IconStar size={12} className="mr-1" /> Favorited
				</>
			),
		}
	} else if (filter.type === "status") {
		const status = filter.value
		const Icon =
			status === ContentStatus.Incomplete
				? IconProgress
				: status === ContentStatus.UnderReview
					? IconMessageCircleUser
					: IconCircleCheck
		return {
			icon: Icon,
			name: status,
			description: `Only show content with status ${status}`,
			pill: (
				<>
					<Icon size={12} className="mr-1" /> {status}
				</>
			),
		}
	} else if (filter.type === "tag") {
		const name =
			filter.category === TagCategory.IntendedAudience
				? employeeRoleDisplayName[filter.name as EmployeeRole]
				: filter.name
		return {
			icon: IconTag,
			name: `${tagCategoryDisplayName[filter.category]}: ${name}`,
			description: `Only show content tagged as ${tagCategoryDisplayName[filter.category]}: ${name}`,
			pill: (
				<>
					<IconTag size={12} className="mr-1" /> {name}
				</>
			),
		}
	} else if (filter.type === "filetype") {
		return {
			icon: (props) => <FileTypeIcon fileType={filter.value} {...props} />,
			name: `File Type: ${fileTypeDisplayName[filter.value]}`,
			description: `Only show ${fileTypeDisplayName[filter.value]} files`,
			pill: (
				<>
					<FileTypeIcon fileType={filter.value} size={12} className="mr-1" />{" "}
					{fileTypeDisplayName[filter.value]}
				</>
			),
		}
	} else if (filter.type === "contenttype") {
		const Icon = filter.value === ContentType.Link ? IconLink : IconFile
		return {
			icon: Icon,
			name: `Content Type: ${contentTypeDisplayName[filter.value]}s`,
			description: `Only show ${contentTypeDisplayName[filter.value].toLowerCase()}s`,
			pill: (
				<>
					<Icon size={12} className="mr-1" />
					{contentTypeDisplayName[filter.value]}s
				</>
			),
		}
	}

	throw new Error("Invalid filter type")
}

function SearchFilterResult({ filter, onSelect }: { filter: SearchFilter; onSelect: () => void }) {
	const { icon: Icon, name, description } = filterDisplayConfig(filter)
	return (
		<Spotlight.Action key={filter.id} closeSpotlightOnTrigger={false} onClick={onSelect}>
			<Flex gap="sm">
				<Icon size={24} strokeWidth={1.5} className="shrink-0 mt-1" />
				<Flex direction="column" gap={4}>
					<Text>{name}</Text>
					<Text size="xs" color="dimmed">
						{description}
					</Text>
				</Flex>
			</Flex>
		</Spotlight.Action>
	)
}
