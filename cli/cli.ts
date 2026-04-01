import { Cli } from "clipanion"
import InfoCommand from "./commands/info.ts"

const [node, app, ...args] = process.argv

const cli = new Cli({
	binaryLabel: `My Application`,
	binaryName: `${node} ${app}`,
	binaryVersion: `1.0.0`,
})

cli.register(InfoCommand)
cli.runExit(args)
