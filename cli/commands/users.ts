import { Command, Option } from "clipanion"
import * as t from "typanion"
import { EmployeeRole } from "../../server/generated/prisma/enums.ts"
import { trpc } from "../trpc.ts"

export class UsersCommand extends Command {
	static override paths = [["users"], Command.Default]

	async execute() {
		const users = await trpc.cli.getUsers.query()
		console.table(users)
	}
}

export class CreateUsersCommand extends Command {
	static override paths = [["users", "create"]]

	name = Option.String()
	email = Option.String()
	role = Option.String({ validator: t.isEnum(Object.values(EmployeeRole)) })

	async execute() {
		const user = await trpc.cli.createUser.mutate({
			name: this.name,
			email: this.email,
			role: this.role,
		})

		console.log(`Created user ${user.id}`)
	}
}
