import { Button, Group, Modal, Stack, Text, TextInput, Textarea } from "@mantine/core"
import { useState } from "react"

type Props = {
	opened: boolean
	onClose: () => void
	onCreate: (values: { title: string; sectionLabel: string; body: string }) => void
}

export default function NewThreadModal({ opened, onClose, onCreate }: Props) {
	const [title, setTitle] = useState("")
	const [sectionLabel, setSectionLabel] = useState("")
	const [body, setBody] = useState("")

	const submit = () => {
		if (!body.trim()) return

		onCreate({
			title: title.trim(),
			sectionLabel: sectionLabel.trim(),
			body: body.trim(),
		})

		setTitle("")
		setSectionLabel("")
		setBody("")
		onClose()
	}

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			centered
			radius="xl"
			title={<Text fw={700}>Start a new discussion</Text>}
		>
			<Stack gap="md">
				<TextInput
					label="Thread title"
					placeholder="Summarize the issue"
					value={title}
					onChange={(e) => setTitle(e.currentTarget.value)}
				/>

				<TextInput
					label="Section label"
					placeholder="Optional section name"
					value={sectionLabel}
					onChange={(e) => setSectionLabel(e.currentTarget.value)}
				/>

				<Textarea
					label="Opening comment"
					placeholder="Describe the issue or question"
					autosize
					minRows={6}
					value={body}
					onChange={(e) => setBody(e.currentTarget.value)}
				/>

				<Group justify="flex-end">
					<Button variant="default" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={submit}>Post thread</Button>
				</Group>
			</Stack>
		</Modal>
	)
}
