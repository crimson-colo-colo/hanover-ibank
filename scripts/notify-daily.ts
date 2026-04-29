import { Temporal } from "@js-temporal/polyfill"
import { db } from "../server/database.ts"
import { NotificationType } from "../server/generated/prisma/enums.ts"
import { auth0Cache } from "../server/lib/auth0.ts"
import { notifyExpiringOneDay } from "../server/lib/notify.ts"
import { isoDateToTimestamp } from "../server/lib.ts"
import { logger } from "../server/logger.ts"

logger.info("Starting daily notification job...")

const today = Temporal.Now.plainDateISO()
const tomorrow = today.add({ days: 1 })

logger.debug(`Today is ${today.toString()}, tomorrow is ${tomorrow.toString()}.`)

logger.info("Finding content expiring tomorrow")

const expiringContent = await db.content.findMany({
	where: {
		expirationDate: {
			gte: isoDateToTimestamp(tomorrow.toString()),
			lt: isoDateToTimestamp(tomorrow.add({ days: 1 }).toString()),
		},
	},
	include: {
		owner: true,
	},
})

logger.info(`Found ${expiringContent.length} content items expiring tomorrow.`)

for (const content of expiringContent) {
	const user = await auth0Cache.getUser(content.owner.id)
	logger.info(
		`- Content "${content.id}" owned by ${user?.username ?? content.ownerId} is expiring on ${new Date(
			content.expirationDate
		).toISOString()}.`
	)
}

for (const content of expiringContent) {
	const notification = await db.notification.create({
		data: {
			employeeId: content.ownerId,
			type: NotificationType.ExpiringOneDay,
			contentId: content.id,
		},
	})
	await notifyExpiringOneDay(notification, content)
}
