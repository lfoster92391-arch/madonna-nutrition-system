import type { UserRole as PrismaUserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { isPizzaDayName } from "@/lib/pizza-day"
import { isLunchLineServingCharge } from "@/lib/lunch-pricing"
import {
  dateKeyUtcNoon,
  formatSchoolWeekday,
  schoolDateKey,
  schoolDayInstantRange,
  upcomingSchoolWeekdayKeys,
} from "@/lib/kitchen/school-day"
import type { UserRole } from "@/lib/types"
import { ROLE_LABELS } from "@/lib/users"

export type LunchSignupRosterSignedUpBy = {
  id: string
  name: string
  role: string
  roleKey: UserRole | null
}

export type LunchSignupRosterRow = {
  id: string
  studentName: string
  mdId: string
  date: string
  mealType: string
  mealLabel: string
  menuTitle: string | null
  sliceCount: number | null
  status: string
  statusLabel: string
  signedUpAt: string | null
  signedUpBy: LunchSignupRosterSignedUpBy | null
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

const PRISMA_ROLE_TO_APP: Record<PrismaUserRole, UserRole> = {
  ADMIN: "admin",
  STAFF: "staff",
  CASHIER: "cashier",
  PARENT: "parent",
  TEACHER: "teacher",
  EXECUTIVE: "admin",
  STUDENT: "student",
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

function statusLabel(status: string) {
  switch (status) {
    case "RESERVED":
      return "Waiting"
    case "PENDING":
      return "Pending"
    case "CANCELLED":
      return "Cancelled"
    case "SERVED":
      return "Served"
    default:
      return status
  }
}

function mapSignedUpBy(
  user: {
    id: string
    firstName: string
    lastName: string
    role: PrismaUserRole
  } | null
): LunchSignupRosterSignedUpBy | null {
  if (!user) return null
  const roleKey = PRISMA_ROLE_TO_APP[user.role] ?? null
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: roleKey ? ROLE_LABELS[roleKey] : user.role,
    roleKey,
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

/** Student IDs with a real lunch-line charge for the school day (kitchen “Served”). */
async function loadServedStudentIds(schoolId: string, dateKey: string): Promise<Set<string>> {
  const { start, endExclusive } = schoolDayInstantRange(dateKey)
  const dayTransactions = await prisma.transaction.findMany({
    where: {
      schoolId,
      createdAt: { gte: start, lt: endExclusive },
      OR: [{ type: "MEAL" }, { type: "DEPOSIT", amount: { lt: 0 } }],
    },
    select: { studentId: true, type: true, mealType: true, amount: true },
  })

  const served = new Set<string>()
  for (const tx of dayTransactions) {
    if (
      isLunchLineServingCharge({
        type: tx.type,
        mealType: tx.mealType,
        amount: Number(tx.amount),
      })
    ) {
      served.add(tx.studentId)
    }
  }
  return served
}

/** Student lunch signups only (no balances, prices, or walk-up financials). */
export async function loadLunchSignupDay(
  schoolId: string,
  dateKey: string
): Promise<LunchSignupRosterDay> {
  const day = dateKeyUtcNoon(dateKey)
  const menuTitle = await loadMenuTitle(schoolId, dateKey)

  const todayKey = schoolDateKey()
  const shouldLoadServed = dateKey <= todayKey

  const [reservations, teacherSignups, servedStudentIds] = await Promise.all([
    prisma.lunchReservation.findMany({
      where: { schoolId, date: day, status: "RESERVED" },
      include: {
        student: {
          select: { id: true, externalId: true, firstName: true, lastName: true },
        },
      },
      orderBy: [{ createdAt: "asc" }, { mealType: "asc" }],
    }),
    prisma.studentLunchSignup.findMany({
      where: { schoolId, date: day },
      include: {
        student: {
          select: { id: true, externalId: true, firstName: true, lastName: true },
        },
        signedUpBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    }),
    shouldLoadServed ? loadServedStudentIds(schoolId, dateKey) : Promise.resolve(new Set<string>()),
  ])

  const signupByStudentId = new Map(
    teacherSignups.map((row) => [
      row.studentId,
      {
        signedUpAt: row.signedUpAt,
        signedUpBy: mapSignedUpBy(row.signedUpBy),
        mealName: row.mealName,
      },
    ])
  )

  type Acc = LunchSignupRosterRow & { _studentId: string; _createdAt: Date }

  const byStudent = new Map<string, Acc>()

  for (const row of reservations) {
    const mdId = row.student.externalId
    const label = mealLabel(row.mealType, menuTitle, row.sliceCount)
    const signupMeta = signupByStudentId.get(row.studentId)
    const isServed = servedStudentIds.has(row.studentId)
    const status = isServed ? "SERVED" : "RESERVED"
    const existing = byStudent.get(mdId)
    if (!existing) {
      byStudent.set(mdId, {
        id: row.id,
        _studentId: row.studentId,
        _createdAt: row.createdAt,
        studentName: `${row.student.firstName} ${row.student.lastName}`.trim(),
        mdId,
        date: dateKey,
        mealType: row.mealType,
        mealLabel: label,
        menuTitle,
        sliceCount: row.sliceCount,
        status,
        statusLabel: statusLabel(status),
        signedUpAt: (signupMeta?.signedUpAt ?? row.createdAt).toISOString(),
        signedUpBy: signupMeta?.signedUpBy ?? null,
      })
      continue
    }
    if (!existing.mealLabel.includes(label)) {
      existing.mealLabel = `${existing.mealLabel}, ${label}`
    }
    if (row.sliceCount) {
      existing.sliceCount = (existing.sliceCount ?? 0) + row.sliceCount
    }
    if (isServed) {
      existing.status = "SERVED"
      existing.statusLabel = statusLabel("SERVED")
    }
    if (row.createdAt < existing._createdAt) {
      existing._createdAt = row.createdAt
      if (!signupMeta?.signedUpAt) {
        existing.signedUpAt = row.createdAt.toISOString()
      }
    }
  }

  for (const signup of teacherSignups) {
    const mdId = signup.student.externalId
    if (byStudent.has(mdId)) continue
    const isServed = servedStudentIds.has(signup.studentId)
    const status = isServed ? "SERVED" : "RESERVED"
    byStudent.set(mdId, {
      id: signup.id,
      _studentId: signup.studentId,
      _createdAt: signup.signedUpAt,
      studentName: `${signup.student.firstName} ${signup.student.lastName}`.trim(),
      mdId,
      date: dateKey,
      mealType: "MAIN",
      mealLabel: signup.mealName || (menuTitle ? `Main · ${menuTitle}` : "Main lunch"),
      menuTitle,
      sliceCount: null,
      status,
      statusLabel: statusLabel(status),
      signedUpAt: signup.signedUpAt.toISOString(),
      signedUpBy: mapSignedUpBy(signup.signedUpBy),
    })
  }

  const signups = [...byStudent.values()]
    .map(({ _studentId: _s, _createdAt: _c, ...row }) => row)
    .sort((a, b) => a.studentName.localeCompare(b.studentName) || a.mdId.localeCompare(b.mdId))

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
