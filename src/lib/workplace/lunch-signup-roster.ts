import { prisma } from "@/lib/prisma"
import { isPizzaDayName } from "@/lib/pizza-day"
import {
  dateKeyUtcNoon,
  formatSchoolWeekday,
  schoolDateKey,
  upcomingSchoolWeekdayKeys,
} from "@/lib/kitchen/school-day"

export type LunchSignupRosterRow = {
  id: string
  studentName: string
  mdId: string
  date: string
  mealType: string
  mealLabel: string
  menuTitle: string | null
  sliceCount: number | null
}

export type LunchSignupRosterDay = {
  date: string
  weekdayLabel: string
  menuTitle: string | null
  isPizzaDay: boolean
  count: number
  signups: LunchSignupRosterRow[]
}

export type LunchSignupRosterPayload = {
  generatedAt: string
  today: LunchSignupRosterDay
  week: LunchSignupRosterDay[]
  weekLabel: string
}

function mealLabel(mealType: string, menuTitle: string | null, sliceCount: number | null): string {
  const pizzaDay = isPizzaDayName(menuTitle)
  if (pizzaDay && mealType === "MAIN") {
    const slices = sliceCount ?? 0
    return slices > 0
      ? `${menuTitle ?? "Pizza Day"} (${slices} slice${slices === 1 ? "" : "s"})`
      : (menuTitle ?? "Pizza Day")
  }
  switch (mealType) {
    case "MAIN":
      return menuTitle ? `Main · ${menuTitle}` : "Main lunch"
    case "SIDE":
      return "Side"
    case "MILK":
      return "Milk"
    case "JUICE":
      return "Juice"
    case "ALA_CARTE":
      return "A la carte"
    default:
      return mealType.replace(/_/g, " ")
  }
}

async function loadMenuTitle(schoolId: string, dateKey: string): Promise<string | null> {
  const event = await prisma.calendarEvent.findFirst({
    where: {
      schoolId,
      date: dateKeyUtcNoon(dateKey),
      category: "menu_day",
      publishStatus: "published",
    },
    orderBy: { createdAt: "desc" },
    select: { title: true },
  })
  return event?.title ?? null
}

/** Student lunch signups only (no balances, prices, or walk-up financials). */
export async function loadLunchSignupDay(
  schoolId: string,
  dateKey: string
): Promise<LunchSignupRosterDay> {
  const day = dateKeyUtcNoon(dateKey)
  const menuTitle = await loadMenuTitle(schoolId, dateKey)

  const reservations = await prisma.lunchReservation.findMany({
    where: { schoolId, date: day, status: "RESERVED" },
    include: {
      student: {
        select: { externalId: true, firstName: true, lastName: true },
      },
    },
    orderBy: [{ createdAt: "asc" }, { mealType: "asc" }],
  })

  const byStudent = new Map<string, LunchSignupRosterRow>()

  for (const row of reservations) {
    const mdId = row.student.externalId
    const label = mealLabel(row.mealType, menuTitle, row.sliceCount)
    const existing = byStudent.get(mdId)
    if (!existing) {
      byStudent.set(mdId, {
        id: row.id,
        studentName: `${row.student.firstName} ${row.student.lastName}`.trim(),
        mdId,
        date: dateKey,
        mealType: row.mealType,
        mealLabel: label,
        menuTitle,
        sliceCount: row.sliceCount,
      })
      continue
    }
    if (!existing.mealLabel.includes(label)) {
      existing.mealLabel = `${existing.mealLabel}, ${label}`
    }
    if (row.sliceCount) {
      existing.sliceCount = (existing.sliceCount ?? 0) + row.sliceCount
    }
  }

  const signups = [...byStudent.values()].sort(
    (a, b) => a.studentName.localeCompare(b.studentName) || a.mdId.localeCompare(b.mdId)
  )

  return {
    date: dateKey,
    weekdayLabel: formatSchoolWeekday(dateKey),
    menuTitle,
    isPizzaDay: isPizzaDayName(menuTitle),
    count: signups.length,
    signups,
  }
}

export async function loadLunchSignupRoster(
  schoolId: string,
  dateKey = schoolDateKey()
): Promise<LunchSignupRosterPayload> {
  const weekKeys = upcomingSchoolWeekdayKeys(dateKey)
  const keysToLoad = weekKeys.includes(dateKey) ? weekKeys : [dateKey, ...weekKeys]

  const loaded = await Promise.all(keysToLoad.map((key) => loadLunchSignupDay(schoolId, key)))
  const byDate = new Map(loaded.map((day) => [day.date, day]))

  const today = byDate.get(dateKey) ?? (await loadLunchSignupDay(schoolId, dateKey))
  const week = weekKeys.map((key) => byDate.get(key)!).filter(Boolean)

  const weekStart = weekKeys[0]
  const weekEnd = weekKeys[weekKeys.length - 1]
  const weekLabel =
    weekStart && weekEnd
      ? `Week of ${formatSchoolWeekday(weekStart)} – ${formatSchoolWeekday(weekEnd)}`
      : "Upcoming school week"

  return {
    generatedAt: new Date().toISOString(),
    today,
    week,
    weekLabel,
  }
}
