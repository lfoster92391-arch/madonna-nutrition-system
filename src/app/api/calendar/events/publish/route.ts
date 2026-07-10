import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { mapCalendarEvent } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"

const publishSchema = z.object({
  publishStatus: z.enum(["draft", "published", "scheduled", "archived"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  eventIds: z.array(z.string().min(1)).optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
})

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = publishSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid publish request", parsed.error.flatten())
      }

      const { publishStatus, date, eventIds, month, year } = parsed.data
      if (!date && !eventIds?.length && (month == null || year == null)) {
        return badRequest("Provide date, eventIds, or month+year")
      }

      const schoolId = await resolveSchoolId()
      const publishedAt =
        publishStatus === "published" ? new Date() : publishStatus === "draft" ? null : undefined

      const where: {
        schoolId: string
        id?: { in: string[] }
        date?: { gte: Date; lte: Date }
      } = { schoolId }

      if (eventIds?.length) {
        where.id = { in: eventIds }
      } else if (date) {
        where.date = {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`),
        }
      } else if (month != null && year != null) {
        const start = new Date(Date.UTC(year, month - 1, 1))
        const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
        where.date = { gte: start, lte: end }
      }

      const updateResult = await prisma.calendarEvent.updateMany({
        where,
        data: {
          publishStatus,
          ...(publishedAt !== undefined ? { publishedAt } : {}),
        },
      })

      const events = await prisma.calendarEvent.findMany({
        where: { schoolId },
        orderBy: { date: "asc" },
      })

      return NextResponse.json({
        success: true,
        count: updateResult.count,
        events: events.map(mapCalendarEvent),
      })
    } catch (error) {
      console.error("POST /api/calendar/events/publish", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
