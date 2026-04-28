import { Flex, HoverCard, Image, Stack, Text } from "@mantine/core"
import type { ContentListItem } from "@shared/types.ts"
import type { CellContext } from "@tanstack/react-table"
import { Avatar } from "@/components/Avatar.tsx"
import { employeeRoleDisplayName } from "@/lib/enums.ts"

export function OwnerColumn({ info }: { info: CellContext<ContentListItem, string> }) {
	return (
		<HoverCard openDelay={250} withArrow>
			<HoverCard.Target>
				<Avatar
					userId={info.row.original.owner.id}
					alt={info.row.original.owner.name}
					width={24}
					height={24}
					radius="100%"
					className="w-6 h-6 shrink-0"
				/>
			</HoverCard.Target>
			<HoverCard.Dropdown className="shadow-sm">
				<Flex gap="md">
					<Image src={`/avatar/${info.row.original.owner.id}`} radius="100%" h={40} w={40} />
					<Stack gap={0} justify="center">
						<Text size="sm" fw={500}>
							{info.row.original.owner.name}
						</Text>
						<Text size="xs" c="gray">
							{info.row.original.owner.email} ·{" "}
							{employeeRoleDisplayName[info.row.original.owner.role]}
						</Text>
					</Stack>
				</Flex>
			</HoverCard.Dropdown>
		</HoverCard>
	)
}
