import { useEffect } from "react"
import { useRouterState } from "@tanstack/react-router"

export function RouterScrollToTop({ smooth = false }: { smooth?: boolean }) {
	useRouteScrollToTop({ smooth })
	return null
}

export function useRouteScrollToTop({ smooth = false }: { smooth?: boolean } = {}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname })

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "instant" })
	}, [pathname, smooth])
}
