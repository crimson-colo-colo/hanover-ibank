import { exec } from "node:child_process"
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

const editor = process.env.TANSTACK_EDITOR

export default defineConfig({
	plugins: [
		devtools({
			consolePiping: {
				enabled: false,
			},
			enhancedLogs: {
				enabled: false,
			},
			editor: {
				name: editor ?? "unknown",
				open: openFileInEditor,
			},
		}),
		tailwindcss(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
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
		allowedHosts: true,
		host: "0.0.0.0",
	},
	build: {
		rollupOptions: {
			input: {
				index: "index.html",
				sw: "sw.ts",
			},
			output: {
				entryFileNames: (chunk) => {
					if (chunk.name === "sw") {
						return "sw.js"
					}
					return "assets/[name]-[hash].js"
				},
			},
		},
	},
})

async function openFileInEditor(path: string, line: string | undefined, col: string | undefined) {
	if (!editor) {
		console.warn(
			`[tsd] TANSTACK_EDITOR is not set, unsure how to open ${path}:${line}:${col}. Please set TANSTACK_EDITOR to vscode, vscode-insiders, or webstorm.`
		)
		return
	}

	let command: string

	if (editor === "vscode-insiders") {
		command = `code-insiders --goto ${path}:${line}:${col}`
	} else if (editor === "vscode") {
		command = `code --goto ${path}:${line}:${col}`
	} else if (editor === "webstorm") {
		command = `webstorm --line ${line} --column ${col} ${path}`
	} else {
		console.warn(
			`[tsd] unsupported editor: ${editor} (supported values: vscode, vscode-insiders, webstorm). Unable to open ${path}:${line}:${col}.`
		)
		return
	}

	console.log(`[tsd] opening ${path}:${line}:${col} in ${editor}`)
	exec(command, (error, stdout, stderr) => {
		if (error) {
			console.error(`[tsd] failed to open editor: ${error.message}`)
			return
		}
		if (stderr) {
			console.error(`[tsd] failed to open editor: ${stderr}`)
			return
		}
		console.log(`[tsd] editor opened successfully: ${stdout}`)
	})
}
