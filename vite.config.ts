import { createRequire } from "node:module"
import path from "node:path"
import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import { defineConfig, normalizePath } from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"

const require = createRequire(import.meta.url)
const pdfjsDistPath = path.dirname(require.resolve("pdfjs-dist/package.json"))
const cMapsDir = normalizePath(path.join(pdfjsDistPath, "cmaps"))

export default defineConfig({
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
		babel({
			presets: [reactCompilerPreset()],
		}),
		viteStaticCopy({
			targets: [
				{
					src: cMapsDir,
					dest: "",
				},
			],
		}),
	],
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		middlewareMode: true,
		host: "0.0.0.0",
	},
})
