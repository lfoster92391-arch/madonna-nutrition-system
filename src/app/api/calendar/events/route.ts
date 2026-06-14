import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapCalendarEvent } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { calendarEventSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const events = await prisma.calendarEvent.findMany({
      where: { schoolId },
      orderBy: { date: "asc" },
    })
    return NextResponse.json(events.map(mapCalendarEvent))
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = calendarEventSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid calendar event", parsed.error.flatten())
      }

      const schoolId = await resolveSchoolId()
      const data = parsed.data
      const event = await prisma.calendarEvent.create({
        data: {
          title: data.title,
          date: new Date(`${data.date}T12:00:00.000Z`),
          description: data.description,
          category: data.category,
          color: data.color,
          mealTemplateId: data.mealTemplateId,
          schoolId,
        },
      })

      return NextResponse.json(mapCalendarEvent(event), { status: 201 })
    } catch (error) {
      console.error("POST /api/calendar/events", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
