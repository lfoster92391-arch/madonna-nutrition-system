import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapCalendarSettings } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { calendarSettingsSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const settings = await prisma.calendarSettings.findUnique({ where: { schoolId } })
    if (!settings) {
      return NextResponse.json({
        headerTitle: "School Lunch Calendar",
        accentColor: "navy",
        schoolName: "Madonna High School",
      })
    }
    return NextResponse.json(mapCalendarSettings(settings))
  })
  return result instanceof NextResponse ? result : result
}

export async function PATCH(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = calendarSettingsSchema.partial().safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid calendar settings", parsed.error.flatten())
      }

      const schoolId = await resolveSchoolId()
      const data = parsed.data
      const settings = await prisma.calendarSettings.upsert({
        where: { schoolId },
        update: {
          headerTitle: data.headerTitle,
          bannerMessage: data.bannerMessage,
          accentColor: data.accentColor,
          schoolName: data.schoolName,
        },
        create: {
          schoolId,
          headerTitle: data.headerTitle ?? "School Lunch Calendar",
          bannerMessage: data.bannerMessage,
          accentColor: data.accentColor ?? "navy",
          schoolName: data.schoolName ?? "Madonna High School",
        },
      })

      return NextResponse.json(mapCalendarSettings(settings))
    } catch (error) {
      console.error("PATCH /api/calendar/settings", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
