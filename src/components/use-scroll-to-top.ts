import { useEffect, useRef, useState, useCallback } from "react"

export interface useScrollToTopOptions {
    threshold?: number
    smooth?: boolean
    containerRef?: React.RefObject<HTMLElement>
}

export interface useScrollToTopReturn {
    isVisible: boolean
    scrollToTop: () => void
}

export function useScrollToTop(
    {
        threshold = 300,
        smooth = true,
        containerRef,
    }: useScrollToTopOptions = {}): useScrollToTopReturn {
    const [isVisible, setIsVisible] = useState(false)
    const rafRef = useRef<number | null>(null)

    const getScrollY = useCallback((): number => {
        if (containerRef?.current) return containerRef.current.scrollTop
        return window.scrollY
    }, [containerRef])

    const scrollToTop = useCallback(() => {
        const behavior: ScrollBehavior = smooth ? 'smooth' : 'instant'
        const target = containerRef?.current ?? window
        target.scrollTo({ top: 0, behavior })
    }, [smooth, containerRef])

    useEffect(() => {
        const target: Window | HTMLElement = containerRef?.current ?? window

        const onScroll = (): void => {
        if (rafRef.current !== null) return
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            setIsVisible(getScrollY() > threshold)
        })
        }

        target.addEventListener('scroll', onScroll, { passive: true })

        setIsVisible(getScrollY() > threshold)

        return () => {
            target.removeEventListener('scroll', onScroll)
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        }
    }, [threshold, getScrollY, containerRef])

    return { isVisible, scrollToTop }
}