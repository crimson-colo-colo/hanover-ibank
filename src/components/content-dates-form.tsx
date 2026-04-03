import { useForm } from "@tanstack/react-form"
import { Button, Stack } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"

interface ContentDates {
	createdAt: string
	modifiedAt: string
}

interface ContentDatesProps {
	initialCreatedAt?: string
	initialModifiedAt?: string
	onSubmit: (values: ContentDates) => void
}

function today(): string {
	return new Date().toISOString().split("T")[0]
}

export function ContentDatesForm({
	initialCreatedAt,
	initialModifiedAt,
	onSubmit,
}: ContentDatesProps) {
	const form = useForm({
		defaultValues: {
			createdAt: initialCreatedAt ?? today(),
			modifiedAt: initialModifiedAt ?? today(),
		},
		onSubmit: async ({ value }) => {
			onSubmit(value)
		},
	})

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				form.handleSubmit()
			}}
			noValidate
		>
			<Stack gap="md">
				<form.Field
					name="createdAt"
					validators={{
						onChange: ({ value }) => {
							if (!value) return "Creation date is required"
							return undefined
						},
					}}
				>
					{(field) => (
						<DatePickerInput
							label="Creation Date"
							placeholder="Pick a date"
							value={field.state.value}
							maxDate={today()}
							onChange={(iso) => {
								field.handleChange(iso ?? "")
								// Bump modifiedAt forward if it now predates createdAt
								const modifiedAt = form.getFieldValue("modifiedAt")
								if (iso && modifiedAt && iso > modifiedAt) {
									form.setFieldValue("modifiedAt", iso)
								}
							}}
							onBlur={field.handleBlur}
							error={
								field.state.meta.isTouched && field.state.meta.errors.length > 0
									? field.state.meta.errors[0]
									: undefined
							}
							w={256}
						/>
					)}
				</form.Field>

				<form.Field
					name="modifiedAt"
					validators={{
						onChange: ({ value, fieldApi }) => {
							if (!value) return "Modification date is required"
							const createdAt = fieldApi.form.getFieldValue("createdAt")
							if (createdAt && value < createdAt) {
								return "Must be on or after the creation date"
							}
							return undefined
						},
					}}
				>
					{(field) => (
						<DatePickerInput
							label="Modification Date"
							description="Auto-filled, editable"
							placeholder="Pick a date"
							value={field.state.value}
							minDate={form.getFieldValue("createdAt") || undefined}
							maxDate={today()}
							onChange={(iso) => field.handleChange(iso ?? "")}
							onBlur={field.handleBlur}
							error={
								field.state.meta.isTouched && field.state.meta.errors.length > 0
									? field.state.meta.errors[0]
									: undefined
							}
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
	)
}
