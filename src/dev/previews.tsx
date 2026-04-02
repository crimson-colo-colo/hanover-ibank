import { ComponentPreview, Previews } from "@react-buddy/ide-toolbox"
import HeaderSimple from "@/components/navbar.tsx"
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
		</Previews>
	)
}

export default ComponentPreviews
