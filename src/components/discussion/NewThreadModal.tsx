import { Button, Flex, Modal, Stack, Text, Textarea, TextInput } from "@mantine/core"
import { schemaResolver, useForm } from "@mantine/form"
import z from "zod"

const schema = z.object({
	title: z.string().max(250, "Title must be at most 2503 characters").optional(),
	sectionLabel: z.string().max(50, "Section label must be at most 50 characters").optional(),
	body: z.string().min(1, "Body cannot be empty").max(5000, "Body must be at most 5000 characters"),
})

export default function NewThreadModal({
	opened,
	onClose,
	onCreate,
}: {
	opened: boolean
	onClose: () => void
	onCreate: (values: {
		title: string | undefined
		sectionLabel: string | undefined
		body: string
	}) => void
}) {
	const form = useForm<z.input<typeof schema>, z.infer<typeof schema>>({
		validate: schemaResolver(schema, { sync: true }),
		transformValues: schema.parse,
	})

	function onSubmit(values: z.infer<typeof schema>) {
		onCreate({
			title: values.title,
			sectionLabel: values.sectionLabel,
			body: values.body,
		})
		form.reset()
		onClose()
	}

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			centered
			title={<Text className="font-bold text-lg font-display">Start a new discussion</Text>}
		>
			<form onSubmit={form.onSubmit(onSubmit)}>
				<Stack gap="md">
					<TextInput
						label="Thread title"
						placeholder="Summarize the issue"
						key={form.key("title")}
						{...form.getInputProps("title")}
					/>

					{/* <TextInput
						label="Section label"
						placeholder="Optional section name"
						key={form.key("sectionLabel")}
						{...form.getInputProps("sectionLabel")}
					/> */}

					<Textarea
						label="Opening comment"
						placeholder="Describe the issue or question"
						autosize
						minRows={6}
						required
						key={form.key("body")}
						{...form.getInputProps("body")}
					/>

					<Flex justify="flex-end" gap="xs">
						<Button variant="subtle" color="gray" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">Post thread</Button>
					</Flex>
				</Stack>
			</form>
		</Modal>
	)
}
