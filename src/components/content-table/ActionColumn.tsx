import type {ContentListItem} from "@shared/types.ts";
import {ContentType, EmployeeRole} from "@prisma/browser.ts";
import {trpcClient} from "@/lib/trpc.ts";
import {
    ActionIcon,
    Flex,
    Menu,
} from "@mantine/core"
import {
    IconCircleArrowUpRight,
    IconDoorEnter,
    IconDoorExit,
    IconDotsVertical,
    IconDownload,
} from "@tabler/icons-react"
import { type CellContext } from "@tanstack/react-table"
import {type Dispatch, type SetStateAction} from "react"

type profileType = {
    id: string,
    name: string,
    email: string,
    username: string,
    role: EmployeeRole | undefined
}

export function ActionColumn({info, selectContentForCheckout, openCheckOutModal, openCheckInModal, profile} : {info : CellContext<ContentListItem, unknown>, selectContentForCheckout : Dispatch<SetStateAction<ContentListItem | null>>, openCheckOutModal: () => void, openCheckInModal: () => void, profile: profileType | undefined}) {
    return (
        <Flex className="content-actions w-max" gap="2px" justify="flex-end">
            {info.row.original.type === "Link" ? (
                <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => {
                        if (info.row.original.type === ContentType.Link) {
                            window.open(info.row.original.url)
                        }
                    }}
                >
                    <IconCircleArrowUpRight/>
                </ActionIcon>
            ) : (
                <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={async () => {
                        const {url} = await trpcClient.content.download.query({
                            id: info.row.original.id,
                        })
                        window.open(url, "_blank", "noopener")
                    }}
                >
                    <IconDownload/>
                </ActionIcon>
            )}
            <Menu width={140} closeOnItemClick={true} position="bottom-end">
                <Menu.Target>
                    <ActionIcon variant="subtle" size="sm">
                        <IconDotsVertical/>
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    {info.row.original.type === "Object" ? (
                        <Menu.Item
                            leftSection={<IconDownload size={22}/>}
                            variant="subtle"
                            onClick={async () => {
                                const {url} = await trpcClient.content.download.query({
                                    id: info.row.original.id,
                                })
                                window.open(url, "_blank", "noopener")
                            }}
                        >
                            Download
                        </Menu.Item>
                    ) : (
                        <Menu.Item
                            leftSection={<IconCircleArrowUpRight size={22}/>}
                            variant="subtle"
                            onClick={() => {
                                if (info.row.original.type === ContentType.Link) {
                                    window.open(info.row.original.url)
                                }
                            }}
                        >
                            Open link
                        </Menu.Item>
                    )}
                    {info.row.original.checkedOutBy === null ? (
                        <Menu.Item
                            leftSection={<IconDoorExit size={22}/>}
                            variant="subtle"
                            onClick={() => {
                                selectContentForCheckout(info.row.original)
                                openCheckOutModal()
                            }}
                        >
                            Check Out
                        </Menu.Item>
                    ) : info.row.original.checkedOutBy.id === profile?.id ? (
                        <Menu.Item
                            leftSection={<IconDoorEnter size={22}/>}
                            variant="subtle"
                            onClick={() => {
                                selectContentForCheckout(info.row.original)
                                openCheckInModal()
                            }}
                        >
                            Check In
                        </Menu.Item>
                    ) : (
                        <Menu.Item leftSection={<IconDoorExit size={22}/>}
                                   variant="subtle" disabled>
                            Check Out
                        </Menu.Item>
                    )}
                </Menu.Dropdown>
            </Menu>
        </Flex>
    )
}