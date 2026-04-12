import { Group, Tooltip } from "@mantine/core"
import { IconInfoCircle } from "@tabler/icons-react"

export function InfoTooltip({ label }: { label: string }) {
	return (
		<Tooltip label={label} multiline maw={260} withArrow position="top-start">
			<IconInfoCircle
				size={14}
				stroke={1.5}
				style={{ color: "var(--mantine-color-dimmed)", cursor: "default" }}
				onClick={(e) => e.preventDefault()}
			/>
		</Tooltip>
	)
}

export function LabelWithTooltip({
	children,
	tooltip,
	required,
}: {
	children: React.ReactNode
	tooltip: string
	required?: boolean
}) {
	return (
		<Group gap={4} align="center">
			{children}
			{required && <span style={{ color: "var(--mantine-color-error)" }}>*</span>}
			<InfoTooltip label={tooltip} />
		</Group>
	)
}
