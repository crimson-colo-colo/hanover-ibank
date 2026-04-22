import { z } from "zod"

// todo: delete this. it shouldn't exist by the time analytics-dashboard-improvements is merged to main
export const ActivityGraph = z.array(z.number())
export const ActivityGraphDay = z.array(z.number()).length(24)
export const ActivityGraphWeek = z.array(ActivityGraphDay).length(7)
export type ActivityGraph = z.infer<typeof ActivityGraph>
export type ActivityGraphDay = z.infer<typeof ActivityGraphDay>
export type ActivityGraphWeek = z.infer<typeof ActivityGraphWeek>
