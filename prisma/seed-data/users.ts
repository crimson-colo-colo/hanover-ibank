// admins: admin, mjordan, wharper, djohnson, sjohansson
// underwriter: emp1

import { EmployeeRole } from "../../server/generated/prisma/browser.ts"
import { auth0Cache } from "../../server/lib/auth0.ts"

// business analyst: emp2
export const employeeData = [
	{ id: "auth0|69d3f8c36ddd007770a559bb", role: EmployeeRole.BusinessAnalyst },
	{ id: "auth0|69d57c86bebf497028094f86", role: EmployeeRole.Admin },
	{ id: "auth0|69db05b92c0b718e1d54aaec", role: EmployeeRole.BusinessAnalyst },
	{ id: "auth0|69d57cd6e7bf39d172e848f0", role: EmployeeRole.Underwriter },
	{ id: "auth0|69d57cdf3f6e9b609fe8a916", role: EmployeeRole.BusinessAnalyst },
	{ id: "auth0|69d57cf83f6e9b609fe8a92f", role: EmployeeRole.Admin }, // admin:admin
	{ id: "auth0|69d57d03e7bf39d172e84921", role: EmployeeRole.Underwriter },
	{ id: "auth0|69d57d0af36c0b4100640b0a", role: EmployeeRole.BusinessAnalyst },
	{ id: "auth0|69d57d78bebf497028095069", role: EmployeeRole.Admin },
	{ id: "auth0|69d57d91f36c0b4100640b99", role: EmployeeRole.Underwriter },
	{ id: "auth0|69d57d9d3f6e9b609fe8a9c4", role: EmployeeRole.BusinessAnalyst },
	{ id: "auth0|69d57daee7bf39d172e849b0", role: EmployeeRole.Underwriter },
	{ id: "auth0|69d57dc6e7bf39d172e849cb", role: EmployeeRole.BusinessAnalyst },
	{ id: "auth0|69e7fb578943d0107ceef473", role: EmployeeRole.Admin },
	{ id: "auth0|69e7fb58edd4fcd00a459790", role: EmployeeRole.Admin },
	{ id: "auth0|69e7fb5894b003bb2d76a03a", role: EmployeeRole.ActuarialAnalyst },
	{ id: "auth0|69e7fb58edd4fcd00a459792", role: EmployeeRole.ActuarialAnalyst },
	{ id: "auth0|69e7fb598943d0107ceef475", role: EmployeeRole.ActuarialAnalyst },
	{ id: "auth0|69e7fb598943d0107ceef476", role: EmployeeRole.ActuarialAnalyst },
	{ id: "auth0|69e7fb5b8943d0107ceef47b", role: EmployeeRole.ExlOperations },
	{ id: "auth0|69e7fb5cedd4fcd00a459794", role: EmployeeRole.ExlOperations },
	{ id: "auth0|69e7fb5d94b003bb2d76a03f", role: EmployeeRole.ExlOperations },
	{ id: "auth0|69e7fb5e94b003bb2d76a040", role: EmployeeRole.ExlOperations },
	{ id: "auth0|69e7fb5f54bbcf711c37cab2", role: EmployeeRole.ExlOperations },
	{ id: "auth0|69e7fb60edd4fcd00a459799", role: EmployeeRole.BusinessOperations },
	{ id: "auth0|69e7fb6054bbcf711c37cab5", role: EmployeeRole.BusinessOperations },
	{ id: "auth0|69e7fb62edd4fcd00a45979a", role: EmployeeRole.BusinessOperations },
	{ id: "auth0|69e7fb62edd4fcd00a45979b", role: EmployeeRole.BusinessOperations },
	{ id: "auth0|69e7fb648943d0107ceef484", role: EmployeeRole.BusinessOperations },
]

export function randomUserId() {
	const randomEmployee = employeeData[Math.floor(Math.random() * employeeData.length)]
	return randomEmployee.id
}

const userRoles = new Map(employeeData.map((e) => [e.id, e.role]))

export function userRoleById(id: string) {
	return userRoles.get(id)!
}

async function assertUsersExist() {
	const auth0Users = await auth0Cache.listUsers()
	const auth0UserIds = new Set(auth0Users.data.map((user) => user.user_id))
	const missingUsers = employeeData.filter((user) => !auth0UserIds.has(user.id))
	if (missingUsers.length > 0) {
		throw new Error(
			`The following users are missing in Auth0: ${missingUsers.map((u) => u.id).join(", ")}`
		)
	}
}

await assertUsersExist()
