import { ComponentPreview, Previews } from "@react-buddy/ide-toolbox"
import { InfoInputForm } from "@/components/InfoInputForm.tsx"
import HeaderSimple from "@/components/navbar.tsx"
import { OwnerField } from "@/components/OwnerField.tsx"
import TagSelect from "@/components/tagselect.tsx"
import UrlInput from "@/components/urlinput.tsx"
import { PaletteTree } from "./palette.tsx"

// import {HeaderSimple} from "@/components/navbar.tsx";

const ComponentPreviews = () => {
	return (
		<Previews palette={<PaletteTree />}>
			<ComponentPreview path="/HeaderSimple">
				<HeaderSimple />
			</ComponentPreview>
			<ComponentPreview path="/tagselect">
				<TagSelect />
			</ComponentPreview>
			<ComponentPreview path="/urlinput">
				<UrlInput />
			</ComponentPreview>
			<ComponentPreview path="/InfoInputForm">
				<InfoInputForm />
			</ComponentPreview>
			<ComponentPreview path="/OwnerField">
				<OwnerField />
			</ComponentPreview>
		</Previews>
	)
}

export default ComponentPreviews
