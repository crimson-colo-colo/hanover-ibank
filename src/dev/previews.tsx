import { ComponentPreview, Previews } from "@react-buddy/ide-toolbox"
import HeaderSimple from "@/components/navbar.tsx"
import { PaletteTree } from "./palette.tsx"

// import {HeaderSimple} from "@/components/navbar.tsx";

const ComponentPreviews = () => {
	return (
		<Previews palette={<PaletteTree />}>
			<ComponentPreview path="/HeaderSimple">
				<HeaderSimple />
			</ComponentPreview>
		</Previews>
	)
}

export default ComponentPreviews
