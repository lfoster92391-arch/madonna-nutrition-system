import { NextResponse } from "next/server"
import { withDatabase } from "@/lib/api/response"
import { resolveSchoolId } from "@/lib/db/school"
import { listKioskPosButtons } from "@/lib/kiosk/pos-buttons"
import { prisma } from "@/lib/prisma"
import { todayDateOnly } from "@/lib/teacher/db"

export const dynamic = "force-dynamic"

/** Active kiosk POS buttons for the lunch scan station (with lunch-rule prices applied). */
export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const todayMenu = await prisma.calendarEvent.findFirst({
      where: { schoolId, date: todayDateOnly(), category: "menu_day" },
      orderBy: { createdAt: "desc" },
      select: { title: true },
    })
    const buttons = await listKioskPosButtons(schoolId, {
      activeOnly: true,
      menuTitle: todayMenu?.title,
    })
    return NextResponse.json({ buttons, menuTitle: todayMenu?.title ?? null })
  })
  return result instanceof NextResponse ? result : result
}
