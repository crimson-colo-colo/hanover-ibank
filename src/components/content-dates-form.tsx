import { useForm } from '@tanstack/react-form'

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
    return new Date().toISOString().split('T')[0]
}

function isValidDate(value: string): boolean {
    if (!value) return false
    const date = new Date(value)
    return !isNaN(date.getTime())
}

const inputClass = [
    'w-64 rounded-lg border border-gray-300 bg-white px-3 py-2',
    'text-lg text-gray-900',
    'transition-colors duration-150',
    'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
    'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
    'dark:focus:border-blue-400 dark:focus:ring-blue-400/20',
].join(' ')

const errorClass = 'mt-1 text-xs text-red-500 dark:text-red-400'
const labelClass = 'mb-1.5 block text-sm font-medium text-black dark:text-black'

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
            className="space-y-5"
        >

            <form.Field
                name="createdAt"
                validators={{
                    onChange: ({ value }) => {
                        if (!value) return 'Creation date is required'
                        if (!isValidDate(value)) return 'Enter a valid date'
                        return undefined
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor={field.name} className={labelClass}>
                            Creation Date:
                        </label>
                        <input
                            id={field.name}
                            type="date"
                            value={field.state.value}
                            max={today()}
                            onChange={(e) => {
                                field.handleChange(e.target.value)
                                const modifiedAt = form.getFieldValue('modifiedAt')
                                if (modifiedAt && e.target.value > modifiedAt) {
                                    form.setFieldValue('modifiedAt', e.target.value)
                                }
                            }}
                            onBlur={field.handleBlur}
                            className={inputClass}
                        />
                        {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                            <p className={errorClass}>{field.state.meta.errors[0]}</p>
                        )}
                    </div>
                )}
            </form.Field>

        <form.Field
            name="modifiedAt"
            validators={{
                onChange: ({ value, fieldApi }) => {
                    if (!value) return 'Modification date is required'
                    if (!isValidDate(value)) return 'Enter a valid date'
                    const createdAt = fieldApi.form.getFieldValue('createdAt')
                    if (createdAt && value < createdAt) {
                        return 'Must be on or after the creation date'
                    }
                    return undefined
                },
            }}
        >
            {(field) => (
                <div>
                    <label htmlFor={field.name} className={labelClass}>
                        Modification Date:
                    </label>
                    <input
                        id={field.name}
                        type="date"
                        value={field.state.value}
                        min={form.getFieldValue('createdAt') || undefined}
                        max={today()}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className={inputClass}
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                        <p className={errorClass}>{field.state.meta.errors[0]}</p>
                    )}
                </div>
            )}
        </form.Field>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                    <button
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                        className={[
                            'w-24 rounded-lg px-3 py-2 text-m font-medium text-white',
                            'transition-colors duration-150',
                            canSubmit && !isSubmitting
                                ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
                                : 'cursor-not-allowed bg-gray-300 dark:bg-gray-600',
                    ].join(' ')}
                    >
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                )}
            </form.Subscribe>
            </form>
    )
}