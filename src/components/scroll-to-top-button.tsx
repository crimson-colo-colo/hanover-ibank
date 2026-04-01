import type { RefObject } from 'react'
import { useScrollToTop } from './use-scroll-to-top.ts'

function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(' ')
}

function ChevronUp({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className={className}
        >
            <polyline points="18 15 12 9 6 15" />
        </svg>
    )
}

export interface ScrollToTopButtonProps {
    threshold?: number
    smooth?: boolean
    containerRef?: RefObject<HTMLElement>
    ariaLabel?: string
    className?: string
}

export function ScrollToTopButton(
    {
        threshold = 300,
        smooth = true,
        containerRef,
        ariaLabel = 'Scroll to top',
        className,
    }: ScrollToTopButtonProps) {
    const { isVisible, scrollToTop } = useScrollToTop({ threshold, smooth, containerRef })

    return (
        <button
            type="button"
            onClick={scrollToTop}
            aria-label={ariaLabel}
            aria-hidden={!isVisible}
            className={cn(
                'fixed bottom-6 right-6 z-50',
                'flex h-11 items-center gap-2 rounded-full px-5',
                'bg-blue-600 text-gray-100 shadow-1g shadow-blue-500/30',
                'hover:bg-blue-500 hover:shadow-blue-400/40',
                'dark:bg-blue-500 dark:hover:bg-blue-400',
                'cursor-pointer border-0',
                'hover:shadow-x1 hover:-translate-y-0.5',
                'active:translate-y-0',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
                'motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-out',
                'motion-safe:translate-y-0',
                isVisible
                    ? 'pointer-events-auto opacity-100'
                    : 'pointer-events-none opacity-0 motion-safe:translate-y-3!',
                className,
            )}
        >
            <span className="text-sm font-medium">Back to top</span>
            <ChevronUp className="h-5 w-5" />
        </button>
    )
}