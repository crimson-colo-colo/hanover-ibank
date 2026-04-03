import { ComponentPreview, Previews } from "@react-buddy/ide-toolbox"
import { InfoInputForm } from "@/components/InfoInputForm.tsx"
import Navigation from "@/components/Navigation.tsx"
import { OwnerField } from "@/components/OwnerField.tsx"
import TagSelect from "@/components/tagselect.tsx"
import UrlInput from "@/components/urlinput.tsx"
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
			<ComponentPreview path="/urlinput">
				<UrlInput value="" onChange={() => {}} />
			</ComponentPreview>
			<ComponentPreview path="/InfoInputForm">
				<InfoInputForm />
			</ComponentPreview>
			<ComponentPreview path="/OwnerField">
				<OwnerField value="" onChange={() => {}} />
			</ComponentPreview>
		</Previews>
	)
}

export default ComponentPreviews
