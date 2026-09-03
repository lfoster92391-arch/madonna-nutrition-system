import { NextResponse } from "next/server"
import type { UserRole as PrismaUserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { notFound } from "@/lib/api/response"
import { findStudentByExternalId, findStudentByScanId } from "@/lib/db/students"
import { dateKeyUtcNoon, schoolDateKey } from "@/lib/kitchen/school-day"
import { withTeacherAccess } from "@/lib/teacher/api"
import { fromDbPaymentMethod } from "@/lib/teacher/db"
import type { UserRole } from "@/lib/types"
import { ROLE_LABELS } from "@/lib/users"

const MEAL_TYPE_LABELS: Record<string, string> = {
  MAIN: "Main lunch",
  SIDE: "Side",
  ALA_CARTE: "A la carte",
  MILK: "Milk",
  JUICE: "Juice",
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

function statusLabel(status: string) {
  switch (status) {
    case "RESERVED":
      return "Reserved — waiting"
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const teacherId = new URL(request.url).searchParams.get("teacherId")

  return withTeacherAccess(teacherId, async () => {
    const student = (await findStudentByExternalId(id)) ?? (await findStudentByScanId(id))
    if (!student) return notFound("Student not found")

    const todayKey = schoolDateKey()
    const today = dateKeyUtcNoon(todayKey)

    const [reservations, signup, upcomingReservations] = await Promise.all([
      prisma.lunchReservation.findMany({
        where: {
          studentId: student.id,
          date: today,
          status: { not: "CANCELLED" },
        },
        orderBy: [{ mealType: "asc" }, { createdAt: "asc" }],
      }),
      prisma.studentLunchSignup.findUnique({
        where: { studentId_date: { studentId: student.id, date: today } },
        include: {
          signedUpBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
      prisma.lunchReservation.findMany({
        where: {
          studentId: student.id,
          date: { gt: today },
          status: { not: "CANCELLED" },
        },
        orderBy: [{ date: "asc" }, { mealType: "asc" }],
        take: 12,
      }),
    ])

    const activeItems = reservations.filter((r) => r.status !== "CANCELLED")
    const signedUp = activeItems.length > 0 || Boolean(signup)

    if (!signedUp) {
      return NextResponse.json({
        date: todayKey,
        signedUp: false,
        activity: null,
        upcoming: upcomingReservations.map((r) => ({
          id: r.id,
          date: r.date.toISOString().slice(0, 10),
          mealType: r.mealType,
          mealTypeLabel: MEAL_TYPE_LABELS[r.mealType] ?? r.mealType,
          status: r.status,
          statusLabel: statusLabel(r.status),
          price: Number(r.totalAmount ?? r.price),
          sliceCount: r.sliceCount,
          createdAt: r.createdAt.toISOString(),
        })),
      })
    }

    const signedUpByUser = signup?.signedUpBy ?? null
    const roleKey = signedUpByUser ? PRISMA_ROLE_TO_APP[signedUpByUser.role] : null

    const earliestCreated =
      activeItems.length > 0
        ? activeItems.reduce(
            (min, row) => (row.createdAt < min ? row.createdAt : min),
            activeItems[0].createdAt
          )
        : (signup?.signedUpAt ?? null)

    const primaryStatus = activeItems[0]?.status ?? "RESERVED"

    return NextResponse.json({
      date: todayKey,
      signedUp: true,
      activity: {
        mealName: signup?.mealName ?? null,
        signedUpAt: (signup?.signedUpAt ?? earliestCreated)?.toISOString() ?? null,
        paymentMethod: signup ? fromDbPaymentMethod(signup.paymentMethod) : null,
        status: primaryStatus,
        statusLabel: statusLabel(primaryStatus),
        signedUpBy: signedUpByUser
          ? {
              id: signedUpByUser.id,
              name: `${signedUpByUser.firstName} ${signedUpByUser.lastName}`.trim(),
              role: roleKey ? ROLE_LABELS[roleKey] : signedUpByUser.role,
              roleKey,
            }
          : null,
        items: activeItems.map((r) => ({
          id: r.id,
          mealType: r.mealType,
          mealTypeLabel: MEAL_TYPE_LABELS[r.mealType] ?? r.mealType,
          status: r.status,
          statusLabel: statusLabel(r.status),
          price: Number(r.totalAmount ?? r.price),
          sliceCount: r.sliceCount,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
      },
      upcoming: upcomingReservations.map((r) => ({
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        mealType: r.mealType,
        mealTypeLabel: MEAL_TYPE_LABELS[r.mealType] ?? r.mealType,
        status: r.status,
        statusLabel: statusLabel(r.status),
        price: Number(r.totalAmount ?? r.price),
        sliceCount: r.sliceCount,
        createdAt: r.createdAt.toISOString(),
      })),
    })
  })
}
