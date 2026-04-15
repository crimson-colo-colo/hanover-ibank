import { createTheme, type MantineColorsTuple } from "@mantine/core"
import { colors } from "@shared/colors.ts"

type ColorIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

type ExtraColors = "black" | "white" | "transparent" | "dimmed" | "bright"

declare module "@mantine/core" {
	interface MantineThemeColorsOverride {
		colors: typeof colors & {
			[k in keyof typeof colors as `${k}.${ColorIndex}`]: MantineColorsTuple
		} & {
			[k in ExtraColors]: string
		}
	}
}

export const theme = createTheme({
	primaryColor: "fuchsia",
	primaryShade: { light: 6, dark: 8 },
	colors: colors,

	headings: {
		fontFamily: "var(--font-display)",
	},
	fontFamily: "var(--font-sans)",

	defaultRadius: "md",

	respectReducedMotion: true,
	cursorType: "pointer",

	autoContrast: true,
	luminanceThreshold: 0.3,
})
