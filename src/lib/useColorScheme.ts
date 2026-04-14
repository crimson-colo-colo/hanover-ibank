import { useMantineColorScheme } from "@mantine/core"

export function useColorScheme() {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme()

	const toggleWithTransition = () => {
		document.documentElement.classList.add("color-scheme-transitioning")
		toggleColorScheme()
		setTimeout(() => {
			document.documentElement.classList.remove("color-scheme-transitioning")
		}, 300)
	}

	return { colorScheme, toggleColorScheme: toggleWithTransition }
}
