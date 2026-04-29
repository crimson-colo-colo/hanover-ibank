import { Cli } from "clipanion"
import { ContentCommand } from "./commands/content.ts"
import { SendEmailCommand } from "./commands/email.ts"
import { ListPushSubscriptionsCommand, SendPushCommand } from "./commands/push.ts"
import { UsersCommand } from "./commands/users.ts"

const [node, app, ...args] = process.argv

const cli = new Cli({
	binaryLabel: `My Application`,
	binaryName: `${node} ${app}`,
	binaryVersion: `1.0.0`,
})

cli.register(UsersCommand)
cli.register(ContentCommand)
cli.register(ListPushSubscriptionsCommand)
cli.register(SendPushCommand)
cli.register(SendEmailCommand)
cli.runExit(args)
