import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapCalendarEvent } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { calendarEventSchema } from "@/lib/api/validation"
import { isWeekendDateKey, WEEKEND_MENU_DAY_MESSAGE } from "@/lib/calendar"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await params
      const schoolId = await resolveSchoolId()
      const body = await request.json()
      const parsed = calendarEventSchema.partial().safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid calendar event update", parsed.error.flatten())
      }

      const existing = await prisma.calendarEvent.findFirst({ where: { id, schoolId } })
      if (!existing) return notFound("Calendar event not found")

      const data = parsed.data
      const nextCategory = data.category ?? existing.category
      const nextDateKey = data.date ?? existing.date.toISOString().slice(0, 10)
      if (nextCategory === "menu_day" && isWeekendDateKey(nextDateKey)) {
        return badRequest(WEEKEND_MENU_DAY_MESSAGE)
      }

      const nextPublishStatus = data.publishStatus
      const publishedAt =
        data.publishedAt != null
          ? new Date(data.publishedAt)
          : nextPublishStatus === "published" && existing.publishStatus !== "published"
            ? new Date()
            : nextPublishStatus === "draft"
              ? null
              : undefined

      const event = await prisma.calendarEvent.update({
        where: { id },
        data: {
          title: data.title,
          date: data.date ? new Date(`${data.date}T12:00:00.000Z`) : undefined,
          description: data.description,
          category: data.category,
          color: data.color,
          mealTemplateId: data.mealTemplateId,
          publishStatus: nextPublishStatus,
          publishedAt,
          notes: data.notes,
        },
      })

      return NextResponse.json(mapCalendarEvent(event))
    } catch (error) {
      console.error("PATCH /api/calendar/events/[id]", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    const { id } = await params
    const schoolId = await resolveSchoolId()
    const existing = await prisma.calendarEvent.findFirst({ where: { id, schoolId } })
    if (!existing) return notFound("Calendar event not found")

    await prisma.calendarEvent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  })
  return result instanceof NextResponse ? result : result
}
