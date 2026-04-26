import { db } from "./database.ts"

export async function logAction({
	employeeId,
	action,
	entity,
	entityId,
	metadata,
}: {
	employeeId: string
	action: string
	entity: string
	entityId: string
	metadata: any
}) {
	await db.activityLog.create({
		data: {
			employeeId,
			action,
			entity,
			entityId,
			metadata,
		},
	})
}
