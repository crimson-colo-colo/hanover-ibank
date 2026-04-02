import {ComponentPreview, Previews} from "@react-buddy/ide-toolbox";
import {PaletteTree} from "./palette.tsx";
import App from "@/routes";
import HeaderSimple from "@/components/navbar.tsx";
// import {HeaderSimple} from "@/components/navbar.tsx";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            {/*<ComponentPreview path="/HeaderSimple">*/}
            {/*    <HeaderSimple/>*/}
            {/*</ComponentPreview>*/}
            <ComponentPreview path="/App">
                <App/>
            </ComponentPreview>
            <ComponentPreview path="/HeaderSimple">
                <HeaderSimple/>
            </ComponentPreview>
        </Previews>
    );
};

export default ComponentPreviews;