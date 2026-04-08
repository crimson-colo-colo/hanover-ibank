import { ComponentPreview, Previews } from "@react-buddy/ide-toolbox"
import { CreateContentForm } from "@/components/CreateContentForm.tsx"
import Navigation from "@/components/Navigation.tsx"
import { OwnerField } from "@/components/OwnerField.tsx"
import TagSelect from "@/components/tagselect.tsx"
import { PaletteTree } from "./palette.tsx"

// import {HeaderSimple} from "@/components/navbar.tsx";

const ComponentPreviews = () => {
	return (
		<Previews palette={<PaletteTree />}>
			<ComponentPreview path="/HeaderSimple">
				<Navigation />
			</ComponentPreview>
			<ComponentPreview path="/tagselect">
				<TagSelect value="" onChange={() => {}} />
			</ComponentPreview>
			<ComponentPreview path="/InfoInputForm">
				<CreateContentForm />
			</ComponentPreview>
			<ComponentPreview path="/OwnerField">
				<OwnerField value="" onChange={() => {}} />
			</ComponentPreview>
		</Previews>
	)
}

export default ComponentPreviews
