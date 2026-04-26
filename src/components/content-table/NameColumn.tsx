import { Anchor, Tooltip } from "@mantine/core"
import type { EmployeeRole } from "@prisma/browser.ts"
import { FileType } from "@shared/filetype.ts"
import type { ContentListItem, recentlyViewedType } from "@shared/types.ts"
import { IconPencilCheck, IconPencilOff } from "@tabler/icons-react"
import type { CellContext } from "@tanstack/react-table"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { formatBytes } from "@/lib/content.ts"

type profileType = {
	id: string
	name: string
	email: string
	username: string
	role: EmployeeRole | undefined
}

export function NameColumn({
	info,
	openFilePreview,
	profile,
	recentlyViewed,
}: {
	info: CellContext<ContentListItem, string>
	openFilePreview: (item: ContentListItem, type: FileType) => void
	profile: profileType | undefined
	recentlyViewed: recentlyViewedType
}) {
	const item = info.row.original
	if (item.type === "Link") {
		const host = new URL(item.url).hostname
		return (
			<div className="flex items-center gap-2 min-w-0">
				<FileTypeIcon fileType={FileType.Link} size={22} strokeWidth={1.5} />
				<Anchor
					c="var(--mantine-color-bright)"
					className="font-semibold m-0 truncate min-w-0 max-w-[30ch]"
					title={item.title}
					onClick={async () => {
						await recentlyViewed.mutateAsync({ id: info.row.original.id })
						openFilePreview(item, FileType.Link)
					}}
				>
					{item.title}
				</Anchor>
				<span className="ml-2 text-xs text-gray-500 truncate" title={item.url}>
					{host.replace(/^www\./, "")}
				</span>
				{info.row.original.checkedOutBy !== null &&
					(info.row.original.checkedOutBy.id === profile?.id ? (
						<Tooltip withArrow arrowSize={8} label="You have this link checked out">
							<IconPencilCheck className="shrink-0" size={24} />
						</Tooltip>
					) : (
						<Tooltip
							withArrow
							arrowSize={8}
							label={`Checked out by ${info.row.original.checkedOutBy.name}`}
						>
							<IconPencilOff className="hover:bg-red-500 hover:rounded-md shrink-0" size={24} />
						</Tooltip>
					))}
			</div>
		)
	} else if (item.type === "Object") {
		const size = formatBytes(item.object.ContentLength ?? 0)
		const fileType = item.object.Metadata?.filetype as FileType | undefined
		return (
			<div className="flex items-center gap-2">
				<FileTypeIcon fileType={fileType ?? FileType.Unknown} size={22} strokeWidth={1.5} />
				<button
					className="font-semibold m-0 truncate min-w-0 max-w-[30ch] hover:underline p-0 border-none bg-transparent text-base cursor-pointer"
					title={item.title}
					onClick={async () => {
						openFilePreview(item, fileType ?? FileType.Unknown)
						await recentlyViewed.mutateAsync({ id: info.row.original.id })
					}}
				>
					{item.title}
				</button>
				<span className="ml-2 text-xs text-gray-500 truncate" title={size}>
					{size}
				</span>
				{info.row.original.checkedOutBy !== null &&
					(info.row.original.checkedOutBy.id === profile?.id ? (
						<Tooltip withArrow arrowSize={8} label="You have this file checked out">
							<IconPencilCheck size={24} />
						</Tooltip>
					) : (
						<Tooltip
							withArrow
							arrowSize={8}
							label={`Checked out by ${info.row.original.checkedOutBy.name}`}
						>
							<IconPencilOff className="checked-out-icon" size={24} />
						</Tooltip>
					))}
			</div>
		)
	}
}
