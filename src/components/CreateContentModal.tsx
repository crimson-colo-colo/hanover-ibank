import { Modal, ScrollArea } from "@mantine/core"
import { CreateContentForm } from "./CreateContentForm.tsx"

interface Props {
	opened: boolean
	onClose: () => void
}

export function CreateContentModal({ opened, onClose }: Props) {
	return (
		<Modal opened={opened} onClose={onClose} title="Create New Content" size="md" scrollAreaComponent={ScrollArea.Autosize}>
			<CreateContentForm onSuccess={onClose} />
		</Modal>
	)
}
