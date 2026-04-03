import { Button, Transition } from "@mantine/core"
import { IconArrowUp } from "@tabler/icons-react"
import type { RefObject } from "react"
import { useScrollToTop } from "./use-scroll-to-top.ts"

export interface ScrollToTopButtonProps {
	threshold?: number
	smooth?: boolean
	containerRef?: RefObject<HTMLElement>
}

export function ScrollToTopButton({
	threshold = 300,
	smooth = true,
	containerRef,
}: ScrollToTopButtonProps) {
	const { isVisible, scrollToTop } = useScrollToTop({ threshold, smooth, containerRef })

	return (
		<Transition mounted={isVisible} transition="slide-up" duration={300} timingFunction="ease">
			{(styles) => (
				<Button
					onClick={scrollToTop}
					aria-label="Scroll to top"
					rightSection={<IconArrowUp size={16} />}
					variant="filled"
					color="teal"
					radius="x1"
					style={{
						...styles,
						position: "fixed",
						bottom: "1.5rem",
						right: "1.5rem",
						zIndex: 9999,
					}}
				>
					Back to top
				</Button>
			)}
		</Transition>
	)
}
