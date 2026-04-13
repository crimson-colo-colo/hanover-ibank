import { useMantineColorScheme } from "@mantine/core"

export function useColorScheme() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme()
    return { colorScheme, toggleColorScheme }
}