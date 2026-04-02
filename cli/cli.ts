import { Cli } from "clipanion"
import { ContentCommand } from "./commands/content.ts"
import { CreateUsersCommand, UsersCommand } from "./commands/users.ts"

const [node, app, ...args] = process.argv

const cli = new Cli({
	binaryLabel: `My Application`,
	binaryName: `${node} ${app}`,
	binaryVersion: `1.0.0`,
})

cli.register(UsersCommand)
cli.register(CreateUsersCommand)
cli.register(ContentCommand)
cli.runExit(args)
