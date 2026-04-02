import { createFileRoute } from "@tanstack/react-router"
import { InfoInputForm } from "@/components/InfoInputForm.tsx"

export const Route = createFileRoute("/upload-content")({
	component: UploadContentForm,
})

function UploadContentForm() {
	return <InfoInputForm />
}
