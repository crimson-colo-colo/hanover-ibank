import { createFileRoute } from "@tanstack/react-router"
import { CreateContentForm } from "@/components/CreateContentForm.tsx"

export const Route = createFileRoute("/_authenticated/upload-content")({
	component: UploadContentForm,
})

function UploadContentForm() {
	return <CreateContentForm />
}
