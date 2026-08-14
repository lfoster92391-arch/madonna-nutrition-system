import { prisma } from "@/lib/prisma"
import { isPizzaDayName } from "@/lib/pizza-day"
import {
  dateKeyUtcNoon,
  formatSchoolWeekday,
  isMondayDateKey,
  schoolDateKey,
  schoolDayInstantRange,
  schoolWeekdayKeys,
} from "@/lib/kitchen/school-day"

export type KitchenPersonKind = "student" | "staff"

export type KitchenLinePerson = {
  id: string
  kind: KitchenPersonKind
  name: string
  lunchNumber: string
  mealName: string
  sliceCount: number | null
  served: boolean
  walkUp: boolean
}

export type KitchenMealCount = {
  name: string
  count: number
  slices: number
}

export type KitchenDaySummary = {
  date: string
  weekdayLabel: string
  menuTitle: string | null
  isPizzaDay: boolean
  eatingCount: number
  orderedCount: number
  servedCount: number
  waitingCount: number
  walkUpCount: number
  pizzaSlices: number
  meals: KitchenMealCount[]
  people: KitchenLinePerson[]
}

export type PizzaLeadSummary = {
  date: string
  weekdayLabel: string
  menuTitle: string
  totalSlices: number
  eatingCount: number
  isToday: boolean
  shownFromMonday: boolean
}

export type KitchenBoardPayload = {
  generatedAt: string
  today: KitchenDaySummary
  pizzaLead: PizzaLeadSummary | null
}

function mealLabel(mealType: string): string {
  switch (mealType) {
    case "MAIN":
      return "Main lunch"
    case "SIDE":
      return "Side"
    case "MILK":
      return "Milk"
    case "ALA_CARTE":
      return "A la carte"
    default:
      return mealType.replace(/_/g, " ")
  }
}

function bumpMeal(map: Map<string, KitchenMealCount>, name: string, slices = 0) {
  const existing = map.get(name)
  if (existing) {
    existing.count += 1
    existing.slices += slices
    return
  }
  map.set(name, { name, count: 1, slices })
}

async function loadMenuTitle(schoolId: string, dateKey: string): Promise<string | null> {
  const event = await prisma.calendarEvent.findFirst({
    where: {
      schoolId,
      date: dateKeyUtcNoon(dateKey),
      category: "menu_day",
    },
    orderBy: { createdAt: "desc" },
    select: { title: true, publishStatus: true },
  })
  if (!event) return null
  if (event.publishStatus && event.publishStatus !== "published") return event.title
  return event.title
}

async function pizzaSlicesForDate(schoolId: string, dateKey: string): Promise<{
  slices: number
  eatingCount: number
}> {
  const day = dateKeyUtcNoon(dateKey)
  const [studentRows, staffRows] = await Promise.all([
    prisma.lunchReservation.findMany({
      where: { schoolId, date: day, status: "RESERVED" },
      select: { sliceCount: true, studentId: true },
    }),
    prisma.teacherLunchReservation.findMany({
      where: { schoolId, date: day, status: "RESERVED" },
      select: { sliceCount: true, userId: true },
    }),
  ])
  const slices =
    studentRows.reduce((sum, row) => sum + (row.sliceCount ?? 0), 0) +
    staffRows.reduce((sum, row) => sum + (row.sliceCount ?? 0), 0)
  const eatingIds = new Set([
    ...studentRows.map((row) => `s:${row.studentId}`),
    ...staffRows.map((row) => `u:${row.userId}`),
  ])
  return { slices, eatingCount: eatingIds.size }
}

async function buildDaySummary(schoolId: string, dateKey: string): Promise<KitchenDaySummary> {
  const day = dateKeyUtcNoon(dateKey)
  const { start, endExclusive } = schoolDayInstantRange(dateKey)
  const menuTitle = await loadMenuTitle(schoolId, dateKey)
  const pizzaDay = isPizzaDayName(menuTitle)

  const [studentReservations, staffReservations, mealTransactions, staffMealLogs] =
    await Promise.all([
      prisma.lunchReservation.findMany({
        where: { schoolId, date: day, status: "RESERVED" },
        include: {
          student: { select: { id: true, externalId: true, firstName: true, lastName: true } },
        },
        orderBy: [{ createdAt: "asc" }],
      }),
      prisma.teacherLunchReservation.findMany({
        where: { schoolId, date: day, status: "RESERVED" },
        include: {
          user: { select: { id: true, badgeId: true, firstName: true, lastName: true } },
        },
        orderBy: [{ createdAt: "asc" }],
      }),
      prisma.transaction.findMany({
        where: {
          schoolId,
          type: "MEAL",
          createdAt: { gte: start, lt: endExclusive },
        },
        include: {
          student: { select: { id: true, externalId: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.auditLog.findMany({
        where: {
          schoolId,
          action: "MEAL_PURCHASE",
          entity: "staff_balance",
          createdAt: { gte: start, lt: endExclusive },
        },
        select: { entityId: true, metadata: true },
      }),
    ])

  const servedStudentIds = new Set(mealTransactions.map((tx) => tx.studentId))
  const servedStaffIds = new Set(
    staffMealLogs.map((log) => log.entityId).filter((id): id is string => Boolean(id))
  )

  const people: KitchenLinePerson[] = []
  const meals = new Map<string, KitchenMealCount>()
  const reservedStudentIds = new Set<string>()
  const reservedStaffIds = new Set<string>()

  for (const row of studentReservations) {
    reservedStudentIds.add(row.studentId)
    const name = `${row.student.firstName} ${row.student.lastName}`.trim()
    const mealName = pizzaDay && row.sliceCount
      ? `${menuTitle ?? "Pizza Day"}`
      : menuTitle && row.mealType === "MAIN"
        ? menuTitle
        : mealLabel(row.mealType)
    const slices = row.sliceCount ?? 0
    bumpMeal(meals, mealName, slices)
    people.push({
      id: `student:${row.studentId}:${row.mealType}`,
      kind: "student",
      name,
      lunchNumber: row.student.externalId,
      mealName,
      sliceCount: row.sliceCount,
      served: servedStudentIds.has(row.studentId),
      walkUp: false,
    })
  }

  for (const row of staffReservations) {
    reservedStaffIds.add(row.userId)
    const name = `${row.user.firstName} ${row.user.lastName}`.trim()
    const mealName = row.mealName || menuTitle || "Staff lunch"
    const slices = row.sliceCount ?? 0
    bumpMeal(meals, mealName, slices)
    people.push({
      id: `staff:${row.userId}`,
      kind: "staff",
      name,
      lunchNumber: row.user.badgeId?.trim() || "Staff",
      mealName,
      sliceCount: row.sliceCount,
      served: servedStaffIds.has(row.userId),
      walkUp: false,
    })
  }

  const seenWalkUpStudents = new Set<string>()
  for (const tx of mealTransactions) {
    if (reservedStudentIds.has(tx.studentId) || seenWalkUpStudents.has(tx.studentId)) continue
    seenWalkUpStudents.add(tx.studentId)
    const mealName = tx.mealType || "Walk-up lunch"
    bumpMeal(meals, mealName)
    people.push({
      id: `walkup-student:${tx.studentId}`,
      kind: "student",
      name: `${tx.student.firstName} ${tx.student.lastName}`.trim(),
      lunchNumber: tx.student.externalId,
      mealName,
      sliceCount: null,
      served: true,
      walkUp: true,
    })
  }

  const staffNameById = new Map<string, string>()
  for (const log of staffMealLogs) {
    if (!log.entityId || reservedStaffIds.has(log.entityId)) continue
    const meta = (log.metadata ?? {}) as { staffName?: string; mealType?: string }
    const name = meta.staffName || staffNameById.get(log.entityId) || "Staff"
    staffNameById.set(log.entityId, name)
    bumpMeal(meals, meta.mealType || "Staff lunch")
    people.push({
      id: `walkup-staff:${log.entityId}`,
      kind: "staff",
      name,
      lunchNumber: "Staff",
      mealName: meta.mealType || "Staff lunch",
      sliceCount: null,
      served: true,
      walkUp: true,
    })
  }

  people.sort((a, b) => a.name.localeCompare(b.name) || a.lunchNumber.localeCompare(b.lunchNumber))

  const uniquePeople = collapsePeople(people)
  const servedCount = uniquePeople.filter((p) => p.served).length
  const orderedCount = uniquePeople.filter((p) => !p.walkUp).length
  const walkUpCount = uniquePeople.filter((p) => p.walkUp).length
  const pizzaSlices = uniquePeople.reduce((sum, p) => sum + (p.sliceCount ?? 0), 0)

  return {
    date: dateKey,
    weekdayLabel: formatSchoolWeekday(dateKey),
    menuTitle,
    isPizzaDay: pizzaDay,
    eatingCount: uniquePeople.length,
    orderedCount,
    servedCount,
    waitingCount: uniquePeople.filter((p) => !p.served).length,
    walkUpCount,
    pizzaSlices,
    meals: [...meals.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    people: uniquePeople,
  }
}

function collapsePeople(people: KitchenLinePerson[]): KitchenLinePerson[] {
  const map = new Map<string, KitchenLinePerson>()
  for (const person of people) {
    const key =
      person.kind === "student"
        ? `s:${person.lunchNumber}`
        : `u:${person.id.split(":")[1] ?? person.lunchNumber}`
    const existing = map.get(key)
    if (!existing) {
      map.set(key, { ...person, id: key })
      continue
    }
    existing.served = existing.served || person.served
    existing.walkUp = existing.walkUp && person.walkUp
    if (person.sliceCount) {
      existing.sliceCount = (existing.sliceCount ?? 0) + person.sliceCount
    }
    if (person.mealName && !existing.mealName.includes(person.mealName)) {
      existing.mealName = `${existing.mealName}, ${person.mealName}`
    }
  }
  return [...map.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.lunchNumber.localeCompare(b.lunchNumber)
  )
}

export async function loadKitchenBoard(schoolId: string, dateKey = schoolDateKey()): Promise<KitchenBoardPayload> {
  const today = await buildDaySummary(schoolId, dateKey)
  const weekKeys = schoolWeekdayKeys(dateKey)

  const weekMenus = await prisma.calendarEvent.findMany({
    where: {
      schoolId,
      category: "menu_day",
      publishStatus: "published",
      date: { in: weekKeys.map(dateKeyUtcNoon) },
    },
    select: { date: true, title: true },
    orderBy: { date: "asc" },
  })

  const pizzaMenu = weekMenus.find((event) => isPizzaDayName(event.title))
  let pizzaLead: PizzaLeadSummary | null = null
  if (pizzaMenu) {
    const pizzaDate = pizzaMenu.date.toISOString().slice(0, 10)
    const inLeadWindow = dateKey <= pizzaDate && weekKeys.includes(dateKey)
    if (inLeadWindow && (isMondayDateKey(dateKey) || dateKey === pizzaDate || dateKey <= pizzaDate)) {
      const totals = await pizzaSlicesForDate(schoolId, pizzaDate)
      pizzaLead = {
        date: pizzaDate,
        weekdayLabel: formatSchoolWeekday(pizzaDate),
        menuTitle: pizzaMenu.title,
        totalSlices: dateKey === pizzaDate ? today.pizzaSlices : totals.slices,
        eatingCount: dateKey === pizzaDate ? today.eatingCount : totals.eatingCount,
        isToday: dateKey === pizzaDate,
        shownFromMonday: isMondayDateKey(dateKey) && dateKey !== pizzaDate,
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    today,
    pizzaLead,
  }
}
