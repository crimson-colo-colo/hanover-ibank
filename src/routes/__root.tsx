import {TanStackDevtools} from "@tanstack/react-devtools"
import {createRootRoute, Outlet} from "@tanstack/react-router"
import {TanStackRouterDevtoolsPanel} from "@tanstack/react-router-devtools"
import {createTheme, MantineProvider} from '@mantine/core'

import "../styles.css"
import {DevSupport} from "@react-buddy/ide-toolbox"
import {ComponentPreviews, useInitial} from "@/dev"
import HeaderSimple from "@/components/navbar";

export const Route = createRootRoute({
    component: RootComponent,
})
let theme = createTheme({})

function RootComponent() {
    return (
        <MantineProvider>
            <DevSupport
                ComponentPreviews={ComponentPreviews}
                useInitialHook={useInitial}
            >
                <MantineProvider theme={theme}>
                <HeaderSimple/>
                <Outlet/>
                <TanStackDevtools
                    config={{
                        position: "bottom-right",
                    }}
                    plugins={[
                        {
                            name: "TanStack Router",
                            render: <TanStackRouterDevtoolsPanel/>,
                        },
                    ]}
                /></MantineProvider>
            </DevSupport>
        </MantineProvider>
    )
}