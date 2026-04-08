import { Button, Modal, Stack, TextInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useForm } from "@tanstack/react-form"

interface EditContentModalProps {
	opened: boolean
	onClose: () => void
	initialModifiedAt?: Date
	initialExpirationDate?: Date | null
	initialOwner?: string
	onSubmit: (values: {
		modifiedAt: Date | null
		expirationDate: Date | null
		owner?: string | null
	}) => void
}

export function EditContentModal({
	opened,
	onClose,
	initialModifiedAt,
	initialExpirationDate,
	initialOwner,
	onSubmit,
}: EditContentModalProps) {
	const form = useForm({
		defaultValues: {
			modifiedAt: initialModifiedAt ?? null,
			expirationDate: initialExpirationDate ?? null,
			owner: initialOwner ?? "",
		},
		onSubmit: async ({ value }) => {
			onSubmit(value)
		},
	})
	return (
		<Modal opened={opened} onClose={onClose} title="Edit Metadata">
			<form
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}
				noValidate
			>
				<Stack gap="md">
					<form.Field name="modifiedAt">
						{(field) => (
							<DatePickerInput
								label="Last Modified Date"
								value={field.state.value}
								onChange={(date) => field.handleChange(date as Date | null)}
								onBlur={field.handleBlur}
								w={256}
							/>
						)}
					</form.Field>

					<form.Field name="expirationDate">
						{(field) => (
							<DatePickerInput
								label="Expiration Date"
								value={field.state.value}
								onChange={(date) => field.handleChange(date as Date | null)}
								onBlur={field.handleBlur}
								w={256}
							/>
						)}
					</form.Field>

					<form.Field name="owner">
						{(field) => (
							<TextInput
								label="Owner"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								w={256}
							/>
						)}
					</form.Field>

					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
						{([canSubmit, isSubmitting]) => (
							<Button
								type="submit"
								disabled={!canSubmit}
								loading={isSubmitting}
								color="#1098ad"
								w={96}
							>
								Save
							</Button>
						)}
					</form.Subscribe>
				</Stack>
			</form>
		</Modal>
	)
}
