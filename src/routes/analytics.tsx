import { createFileRoute } from "@tanstack/react-router"
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard.tsx"

export const Route = createFileRoute("/analytics")({
	component: AnalyticsDashboard,
})
