import { Button, Flex, Paper, Stack, Text, Title } from "@mantine/core"
import { FileType } from "@shared/filetype.ts"
import { IconLoader2 } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import clsx from "clsx"
import { formatDistanceToNow } from "date-fns"
import { FileTypeIcon } from "@/components/FileTypeIcon.tsx"
import { trpc } from "@/lib/trpc.ts"

export function ExpiringContentModule({
	setSelectedContent,
	setSelectedContentFileType,
	openFilePreviewModal,
}: {
	setSelectedContent: (param: React.SetStateAction<string | null>) => void
	setSelectedContentFileType: (param: React.SetStateAction<FileType | null>) => void
	openFilePreviewModal: () => void
}) {
	const expiringContent = useQuery(trpc.content.getExpiringContent.queryOptions())
	const topFiveExpiring = expiringContent.data?.slice(0, 5)
	return (
		<Paper p="lg" withBorder>
			<Link
				to="/content-table"
				search={{ view: "expiringSoon" }}
				className="no-underline text-inherit flex items-center mb-sm gap-2 w-fit hover:underline"
			>
				<Title order={3}>Expiring Content</Title>
				{expiringContent.isFetching && <IconLoader2 className="animate-spin" size={24} />}
			</Link>
			<Stack h="90%" gap={4} align="stretch">
				{topFiveExpiring?.map((item) => {
					const contentType =
						item.type === "Link"
							? FileType.Link
							: ((item.object.Metadata?.filetype as FileType) ?? FileType.Unknown)
					return (
						<Button
							variant="subtle"
							justify="flex-start"
							key={item.id}
							h={70}
							onClick={() => {
								setSelectedContent(item.id)
								setSelectedContentFileType(contentType)
								openFilePreviewModal()
							}}
						>
							<FileTypeIcon
								fileType={contentType}
								size={56}
								strokeWidth={1.5}
								className="pr-5 shrink-0"
							/>
							<Flex direction="column" align="start" className="truncate">
								<Text className="pr-4 font-semibold truncate max-w-full">{item.title}</Text>
								<Text
									className={clsx(
										"text-sm",
										item.expirationDate.getTime() < Date.now() ? "text-red-600" : "text-dimmed"
									)}
								>
									{item.expirationDate.getTime() < Date.now() ? "expired " : "expires "}
									{formatDistanceToNow(item.expirationDate, { addSuffix: true }).replace(
										/^(in )?about /,
										"$1"
									)}
								</Text>
							</Flex>
						</Button>
					)
				})}
			</Stack>
		</Paper>
	)
}
