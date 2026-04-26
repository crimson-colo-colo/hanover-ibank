import { Button } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
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

const DASHBOARD_STEPS: Step[] = [
	{
		target: "#dashboard-welcome",
		title: "Welcome to iBank!",
		content:
			"This is your personal dashboard. It shows your name and role at the top so you always know who you're logged in as.",
		placement: "bottom",
	},
	{
		target: "#dashboard-favorites",
		title: "Your Favorites",
		content:
			"Pinned content you've marked as a favorite appears here for quick access. Star any file or link in the table below to add it.",
		placement: "bottom",
	},
	{
		target: "#dashboard-content-section",
		title: "Content Library",
		content:
			"This table lists all the content available to you — files, documents, and links. You can sort, filter, search, and manage everything from here.",
		placement: "top",
	},
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
			"Update your display name, username, and email address here. Changes are reflected immediately across the platform.",
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
			"Each square represents a day. Darker squares mean more active users that day. Hover a square for an exact count.",
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
	{ steps: PROFILE_STEPS, path: "/profile" },
]

const ADMIN_BOUNDARIES: PageBoundary[] = [
	{ steps: DASHBOARD_STEPS, path: "/dashboard" },
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
	}, [isAdmin.isLoading])

	function completeTutorial() {
		localStorage.setItem(TUTORIAL_STORAGE_KEY, "true")
	}

	function startTutorial() {
		setShowPrompt(false)
		setPageIndex(0)
		setStepIndex(0)
		navigate({ to: "/dashboard" }).then(async () => {
			const firstTarget = boundaries[0]?.steps[0]?.target as string
			if (firstTarget) await waitForTarget(firstTarget)
			setRun(true)
		})
	}

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

	const { Tour } = useJoyride({
		steps: currentSteps,
		stepIndex,
		run,
		continuous: true,
		scrollToFirstStep: true,
		onEvent: handleEvent,
		locale: {
			back: "Back",
			close: "Close",
			last: isLastPage ? "Finish" : "Next page →",
			next: "Next",
			skip: "Skip tour",
		},
		options: {
			primaryColor: "var(--mantine-primary-color-filled)",
			zIndex: 10000,
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
					border: "1px solid var(--mantine-color-default-border)",
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
