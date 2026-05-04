import { Button } from "@mantine/core"
import {
	IconAlertCircle,
	IconCalendarStats,
	IconCamera,
	IconChartBar,
	IconChartPie,
	IconClock,
	IconFile,
	IconFilter,
	IconHeart,
	IconLayoutDashboard,
	IconLayoutGrid,
	IconLayoutSidebar,
	IconLink,
	IconSearch,
	IconSettings,
	IconStar,
	IconTable,
	IconTrendingUp,
	IconUpload,
	IconUserPlus,
	IconUsers,
	IconX,
} from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import type { MouseEvent, ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { TooltipRenderProps } from "react-joyride"
import {
	ACTIONS,
	type Controls,
	EVENTS,
	type EventData,
	STATUS,
	type Step,
	useJoyride,
} from "react-joyride"
import { trpc } from "@/lib/trpc.ts"

const TUTORIAL_STORAGE_KEY = "ibank-tutorial-completed"

export const TUTORIAL_START_EVENT = "ibank:start-tutorial"

const STEP_ICONS: Record<string, ReactNode> = {
	"#dashboard-welcome": <IconLayoutDashboard size={18} />,
	"#side-navigation": <IconLayoutSidebar size={18} />,
	"#dashboard-module-favorite-content": <IconStar size={18} />,
	"#dashboard-module-recently-viewed": <IconClock size={18} />,
	"#dashboard-module-popular-links": <IconLink size={18} />,
	"#dashboard-module-popular-files": <IconFile size={18} />,
	"#dashboard-module-expiring-content": <IconAlertCircle size={18} />,
	"#dashboard-module-account-statistics": <IconChartBar size={18} />,
	"#content-filter-control": <IconFilter size={18} />,
	"#upload-content-btn": <IconUpload size={18} />,
	"#content-search-input": <IconSearch size={18} />,
	"#content-table": <IconTable size={18} />,
	"#favorites-header": <IconHeart size={18} />,
	"#favorites-view-toggle": <IconLayoutGrid size={18} />,
	"#profile-avatar-section": <IconCamera size={18} />,
	"#profile-form": <IconSettings size={18} />,
	"#analytics-metrics": <IconChartBar size={18} />,
	"#analytics-uploads-chart": <IconTrendingUp size={18} />,
	"#analytics-file-charts": <IconChartPie size={18} />,
	"#analytics-heatmap": <IconCalendarStats size={18} />,
	"#manage-users-header": <IconUsers size={18} />,
	"#add-user-btn": <IconUserPlus size={18} />,
}

interface StepData {
	globalNum: number
	totalSteps: number
	isLastPage: boolean
	skipPage: (controls: Controls) => void
}

function TutorialTooltip({
	backProps,
	closeProps,
	controls,
	index,
	isLastStep,
	primaryProps,
	skipProps,
	step,
	tooltipProps,
}: TooltipRenderProps) {
	const data = step.data as StepData | undefined
	const globalNum = data?.globalNum ?? index + 1
	const total = data?.totalSteps ?? 1
	const lastPage = data?.isLastPage ?? false
	const progress = (globalNum / total) * 100
	const icon = STEP_ICONS[step.target as string]
	const primaryLabel = isLastStep ? (lastPage ? "Finish" : "Next page →") : "Next"
	const skipLabel = lastPage ? "Skip tour" : "Skip page"
	const handleSkip = lastPage
		? skipProps.onClick
		: (e: MouseEvent<HTMLButtonElement>) => {
				e.preventDefault()
				data?.skipPage(controls)
			}

	return (
		<div
			{...tooltipProps}
			style={{
				background: "var(--mantine-color-body)",
				// border: "2px solid var(--mantine-primary-color-filled)",
				borderRadius: 12,
				maxWidth: 400,
				boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
				overflow: "hidden",
				fontFamily: "var(--mantine-font-family)",
			}}
		>
			<div
				style={{
					height: 4,
					background: "var(--mantine-color-default-border)",
				}}
			>
				<div
					style={{
						height: "100%",
						width: `${progress}%`,
						background: "var(--mantine-primary-color-filled)",
						transition: "width 0.3s ease",
					}}
				/>
			</div>

			<div style={{ padding: "14px 18px 18px", position: "relative" }}>
				<button
					{...closeProps}
					style={{
						position: "absolute",
						top: 10,
						right: 10,
						background: "none",
						border: "none",
						cursor: "pointer",
						padding: 4,
						color: "var(--mantine-color-dimmed)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						borderRadius: 4,
					}}
				>
					<IconX size={14} />
				</button>

				<div
					style={{
						fontSize: 11,
						color: "var(--mantine-color-dimmed)",
						marginBottom: 8,
					}}
				>
					Step {globalNum} of {total}
				</div>

				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						marginBottom: 8,
						paddingRight: 24,
					}}
				>
					{icon && (
						<div
							style={{
								color: "var(--mantine-primary-color-filled)",
								flexShrink: 0,
								display: "flex",
							}}
						>
							{icon}
						</div>
					)}
					{step.title && (
						<div
							style={{
								fontWeight: 600,
								fontSize: 15,
								color: "var(--mantine-color-text)",
								lineHeight: 1.3,
							}}
						>
							{step.title as ReactNode}
						</div>
					)}
				</div>

				<div
					style={{
						fontSize: 13,
						color: "var(--mantine-color-dimmed)",
						marginBottom: 16,
						lineHeight: 1.6,
					}}
				>
					{step.content as ReactNode}
				</div>

				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Button variant="subtle" color="gray" size="xs" {...skipProps} onClick={handleSkip}>
						{skipLabel}
					</Button>
					<div style={{ display: "flex", gap: 8 }}>
						{index > 0 && (
							<Button variant="subtle" size="xs" {...backProps}>
								Back
							</Button>
						)}
						<Button size="xs" {...primaryProps}>
							{primaryLabel}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

const DASHBOARD_STEPS: Step[] = [
	{
		target: "#dashboard-welcome",
		title: "Welcome to iBank!",
		content:
			"This is your personal dashboard. It greets you with your name and role at the top. Click the gear icon in the top-right of this banner to rearrange or hide any of the modules below.",
		placement: "bottom",
		scrollOffset: 50,
	},
	{
		target: "#side-navigation",
		title: "Your Navigation",
		content:
			"This is the sidebar — your map for the whole app. Use it to jump between Home, Content, Favorites, About, and Technology (plus Employees and Analytics if you're an admin). Recently Viewed gives you quick links to content you've opened lately, and the Help section in the middle has a \"Take a tour\" button that replays this tutorial whenever you want.",
		placement: "right",
	},
	{
		target: "#dashboard-module-favorite-content",
		title: "Favorite Content",
		content:
			"Anything you've starred shows up here for quick access. Click any item to preview it.",
		placement: "top",
	},
	{
		target: "#dashboard-module-recently-viewed",
		title: "Recently Viewed",
		content: "The last few files and links you've opened, so you can pick up where you left off.",
		placement: "top",
	},
	{
		target: "#dashboard-module-popular-links",
		title: "Popular Links",
		content:
			"The most-visited links across your organization — useful for finding the resources your coworkers rely on.",
		placement: "top",
	},
	{
		target: "#dashboard-module-popular-files",
		title: "Popular Files",
		content:
			"The most-accessed files across the platform. A good place to discover important documents you might not know about yet.",
		placement: "top",
	},
	{
		target: "#dashboard-module-expiring-content",
		title: "Expiring Content",
		content:
			"Content with an expiration date approaching. Keep an eye here so nothing important lapses without you knowing.",
		placement: "top",
	},
	{
		target: "#dashboard-module-account-statistics",
		title: "Account Statistics",
		content:
			"A quick summary of your account: how many files and links you own, and how long you've had your account.",
		placement: "top",
	},
]
const CONTENT_STEPS: Step[] = [
	{
		target: "#content-filter-control",
		title: "For You vs. Show All",
		content:
			'"For You" shows content owned by or assigned to you. Switch to "Show All" to browse the entire content library shared across your organization.',
		placement: "bottom",
	},
	{
		target: "#upload-content-btn",
		title: "Upload Content",
		content:
			"Click here to upload a new file or add a link. You can provide a title, description, tags, and set an expiration date.",
		placement: "bottom",
	},
	{
		target: "#content-search-input",
		title: "Search",
		content:
			"Quickly find any file or link by name. You can also press Ctrl+K from anywhere on the page to jump straight to the search box.",
		placement: "bottom",
	},
	{
		target: "#content-table",
		title: "Content Table",
		content:
			"Each row is a piece of content. Click the star to favorite it, click the file name to preview it, and use the action menu (⋮) to download, check out, or check in.",
		placement: "top",
	},
]

const FAVORITES_STEPS: Step[] = [
	{
		target: "#favorites-header",
		title: "Your Favorites",
		content:
			"Anything you star anywhere in the app shows up here for quick access. You can preview, download, or unfavorite items right from this page.",
		placement: "bottom",
		scrollOffset: 1000,
	},
	{
		target: "#favorites-view-toggle",
		title: "Grid or List View",
		content:
			"Switch between a visual grid of thumbnails and a sortable list. List view also lets you select multiple favorites and unfavorite them in bulk.",
		placement: "bottom",
		scrollOffset: 1000,
	},
]

const PROFILE_STEPS: Step[] = [
	{
		target: "#profile-avatar-section",
		title: "Your Profile Picture",
		content:
			"Click the camera icon to upload a custom avatar. Your picture appears next to your name throughout the app.",
		placement: "bottom",
	},
	{
		target: "#profile-form",
		title: "Profile Settings",
		content:
			"Update your display name, username, email address, and notification preferences here. Changes are reflected immediately across the platform.",
		placement: "top",
	},
]

const ADMIN_ANALYTICS_STEPS: Step[] = [
	{
		target: "#analytics-metrics",
		title: "Key Metrics",
		content:
			"A quick snapshot of platform activity: time on site, total uploads, file and link counts, your busiest month, and total employee count.",
		placement: "bottom",
		scrollOffset: 500,
	},
	{
		target: "#analytics-uploads-chart",
		title: "Uploads Over Time & Recent Activity",
		content:
			"The area chart tracks file and link uploads over the last 12 months. The timeline on the right shows the most recent actions taken by any user on the platform.",
		placement: "top",
	},
	{
		target: "#analytics-file-charts",
		title: "File Type Breakdown",
		content:
			"The pie chart shows the distribution of content types, and the bar chart compares how much storage each type is consuming.",
		placement: "top",
	},
	{
		target: "#analytics-heatmap",
		title: "User Activity Heatmap",
		content:
			"Each circle represents a day. Darker circles mean more active users that day. Hover a circle for an exact count.",
		placement: "top",
	},
]

const MANAGE_USERS_STEPS: Step[] = [
	{
		target: "#manage-users-header",
		title: "Manage Employees",
		content:
			"As an admin you can view, edit, and delete employee accounts from this table. Each row shows the employee's name, username, email, and role.",
		placement: "bottom",
	},
	{
		target: "#add-user-btn",
		title: "Add a New Employee",
		content:
			"Click here to create a new employee account. You'll set their name, email, username, and role (e.g. Underwriter, Analyst, Admin).",
		placement: "bottom",
	},
]

interface PageBoundary {
	steps: Step[]
	path: string
}

const NON_ADMIN_BOUNDARIES: PageBoundary[] = [
	{ steps: DASHBOARD_STEPS, path: "/dashboard" },
	{ steps: CONTENT_STEPS, path: "/content-table" },
	{ steps: FAVORITES_STEPS, path: "/favorites" },
	{ steps: PROFILE_STEPS, path: "/profile" },
]

const ADMIN_BOUNDARIES: PageBoundary[] = [
	{ steps: DASHBOARD_STEPS, path: "/dashboard" },
	{ steps: CONTENT_STEPS, path: "/content-table" },
	{ steps: FAVORITES_STEPS, path: "/favorites" },
	{ steps: ADMIN_ANALYTICS_STEPS, path: "/admin/analytics" },
	{ steps: MANAGE_USERS_STEPS, path: "/admin/manage-users" },
	{ steps: PROFILE_STEPS, path: "/profile" },
]

function waitForTarget(selector: string, timeout = 3000): Promise<boolean> {
	return new Promise((resolve) => {
		if (document.querySelector(selector)) return resolve(true)
		const observer = new MutationObserver(() => {
			if (document.querySelector(selector)) {
				observer.disconnect()
				resolve(true)
			}
		})
		observer.observe(document.body, { childList: true, subtree: true })
		setTimeout(() => {
			observer.disconnect()
			resolve(false)
		}, timeout)
	})
}

export function NewUserTutorial() {
	const navigate = useNavigate()
	const isAdmin = useQuery(trpc.admin.isAdmin.queryOptions())

	const [run, setRun] = useState(false)
	const [stepIndex, setStepIndex] = useState(0)
	const [pageIndex, setPageIndex] = useState(0)
	const [showPrompt, setShowPrompt] = useState(false)
	const navigatingRef = useRef(false)

	const boundaries = isAdmin.data ? ADMIN_BOUNDARIES : NON_ADMIN_BOUNDARIES
	const currentSteps = boundaries[pageIndex]?.steps ?? []
	const isLastPage = pageIndex >= boundaries.length - 1

	useEffect(() => {
		if (isAdmin.isLoading) return
		const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true"
		if (!completed) setShowPrompt(true)
		//setShowPrompt(true) -> if you want the tutorial to always appear, as like a test thingy then uncomment this line, and comment the two above out
	}, [isAdmin.isLoading])

	function completeTutorial() {
		localStorage.setItem(TUTORIAL_STORAGE_KEY, "true")
	}

	const startTutorial = useCallback(() => {
		setShowPrompt(false)
		setRun(false)
		setPageIndex(0)
		setStepIndex(0)
		navigatingRef.current = true
		navigate({ to: "/dashboard" }).then(async () => {
			const firstTarget = boundaries[0]?.steps[0]?.target as string
			if (firstTarget) await waitForTarget(firstTarget)
			navigatingRef.current = false
			setRun(true)
		})
	}, [boundaries, navigate])

	useEffect(() => {
		function onStart() {
			startTutorial()
		}
		window.addEventListener(TUTORIAL_START_EVENT, onStart)
		return () => window.removeEventListener(TUTORIAL_START_EVENT, onStart)
	}, [startTutorial])

	function dismissTutorial() {
		setShowPrompt(false)
		completeTutorial()
	}

	const goToNextPage = useCallback(
		(controls: Controls) => {
			const nextPageIndex = pageIndex + 1
			const next = boundaries[nextPageIndex]
			if (!next) {
				controls.stop()
				completeTutorial()
				return
			}
			navigatingRef.current = true
			setRun(false)
			setPageIndex(nextPageIndex)
			setStepIndex(0)
			navigate({ to: next.path as "/" }).then(async () => {
				const firstTarget = next.steps[0]?.target as string
				if (firstTarget) await waitForTarget(firstTarget)
				navigatingRef.current = false
				setRun(true)
			})
		},
		[boundaries, pageIndex, navigate]
	)

	const goToPrevPage = useCallback(
		(controls: Controls) => {
			const prevPageIndex = pageIndex - 1
			const prev = boundaries[prevPageIndex]
			if (!prev) return
			navigatingRef.current = true
			setRun(false)
			setPageIndex(prevPageIndex)
			const lastStepIndex = prev.steps.length - 1
			setStepIndex(lastStepIndex)
			navigate({ to: prev.path as "/" }).then(async () => {
				const lastTarget = prev.steps[lastStepIndex]?.target as string
				if (lastTarget) await waitForTarget(lastTarget)
				navigatingRef.current = false
				setRun(true)
			})
		},
		[boundaries, pageIndex, navigate]
	)

	const handleEvent = useCallback(
		(data: EventData, controls: Controls) => {
			const { action, index, status, type } = data

			if (action === ACTIONS.CLOSE) {
				controls.stop()
				setRun(false)
				completeTutorial()
				return
			}

			if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
				if (action === ACTIONS.NEXT) {
					const nextStep = index + 1
					if (nextStep >= currentSteps.length) {
						goToNextPage(controls)
					} else {
						setStepIndex(nextStep)
					}
				} else if (action === ACTIONS.PREV) {
					const prevStep = index - 1
					if (prevStep < 0) {
						goToPrevPage(controls)
					} else {
						setStepIndex(prevStep)
					}
				}
			}

			if (status === STATUS.SKIPPED || (status === STATUS.FINISHED && !navigatingRef.current)) {
				setRun(false)
				completeTutorial()
			}
		},
		[currentSteps.length, goToNextPage, goToPrevPage]
	)
	const totalSteps = boundaries.reduce((sum, boundary) => sum + boundary.steps.length, 0)
	const stepsBeforeCurrentPage = boundaries
		.slice(0, pageIndex)
		.reduce((sum, boundary) => sum + boundary.steps.length, 0)

	const stepsWithData: Step[] = currentSteps.map((step, index) => ({
		...step,
		data: {
			globalNum: stepsBeforeCurrentPage + index + 1,
			totalSteps,
			isLastPage,
			skipPage: goToNextPage,
		} satisfies StepData,
	}))
	const { Tour } = useJoyride({
		steps: stepsWithData,
		stepIndex,
		run,
		continuous: true,
		scrollToFirstStep: true,
		onEvent: handleEvent,
		tooltipComponent: TutorialTooltip,
		options: {
			primaryColor: "var(--mantine-primary-color-filled)",
			zIndex: 10000,
			skipBeacon: true,
			backgroundColor: "var(--mantine-color-body)",
			textColor: "var(--mantine-color-text)",
			arrowColor: "var(--mantine-color-body)",
			overlayColor: "rgba(0, 0, 0, 0.5)",
		},
	})

	if (showPrompt) {
		return (
			<div
				style={{
					position: "fixed",
					bottom: 24,
					right: 24,
					zIndex: 9999,
					background: "var(--mantine-color-body)",
					// border: "1px solid var(--mantine-color-default-border)",
					borderRadius: 12,
					padding: "20px 24px",
					maxWidth: 340,
					boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
				}}
			>
				<p style={{ margin: "0 0 4px 0", fontWeight: 600, fontSize: 15 }}>New to iBank?</p>
				<p style={{ margin: "0 0 16px 0", fontSize: 13, color: "var(--mantine-color-dimmed)" }}>
					Take a quick tour to learn how to upload content, manage favorites, view analytics, and
					more.
				</p>
				<div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
					<Button variant="subtle" color="gray" size="xs" onClick={dismissTutorial}>
						Skip
					</Button>
					<Button size="xs" onClick={startTutorial}>
						Start tour
					</Button>
				</div>
			</div>
		)
	}

	return Tour
}
