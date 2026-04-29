import { Tooltip } from "@mantine/core"
import { IconHelpCircle } from "@tabler/icons-react"
import { useState } from "react"
import {
	ACTIONS,
	type Controls,
	EVENTS,
	type EventData,
	STATUS,
	type Step,
	useJoyride,
} from "react-joyride"

interface HelpHintProps {
	feature: string
	steps: Step[]
	size?: number
}

export function HelpHint({ feature, steps, size = 16 }: HelpHintProps) {
	const [run, setRun] = useState(false)
	const [stepIndex, setStepIndex] = useState(0)

	function handleClick(e: React.MouseEvent) {
		e.stopPropagation()
		setStepIndex(0)
		setRun(true)
	}

	function handleEvent(data: EventData, _controls: Controls) {
		const { action, index, status, type } = data

		if (type === EVENTS.STEP_AFTER) {
			if (action === ACTIONS.NEXT) {
				setStepIndex(index + 1)
			} else if (action === ACTIONS.PREV) {
				setStepIndex(Math.max(0, index - 1))
			}
		}

		if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
			setRun(false)
			setStepIndex(0)
		}
	}

	const { Tour } = useJoyride({
		steps,
		stepIndex,
		run,
		continuous: steps.length > 1,
		scrollToFirstStep: true,
		onEvent: handleEvent,
		locale: {
			back: "Back",
			close: "Got it",
			last: "Got it",
			next: "Next",
			skip: "Close",
		},
		options: {
			primaryColor: "var(--mantine-primary-color-filled)",
			zIndex: 10000,
		},
	})

	return (
		<>
			<Tooltip label={`Learn about ${feature}`} withArrow position="top">
				<button
					type="button"
					onClick={handleClick}
					aria-label={`Learn about ${feature}`}
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						background: "transparent",
						border: "none",
						padding: 2,
						cursor: "pointer",
						color: "var(--mantine-color-dimmed)",
						verticalAlign: "middle",
					}}
				>
					<IconHelpCircle size={size} stroke={1.75} />
				</button>
			</Tooltip>
			{Tour}
		</>
	)
}
