import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { badRequest, withDatabase } from "@/lib/api/response"
import { findStudentByScanId } from "@/lib/db/students"
import { requireWorkplaceLunchSignupSession } from "@/lib/auth/workplace-lunch"

export const dynamic = "force-dynamic"

/**
 * Search any school student by MD ID / name for workplace lunch signup.
 * Includes disabled students so the UI can show a clear message.
 */
export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    const auth = await requireWorkplaceLunchSignupSession(request)
    if ("error" in auth) return auth.error

    const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""
    if (query.length < 1) {
      return badRequest("Search query is required")
    }

    const q = query.toLowerCase()
    const students = await prisma.student.findMany({
      where: {
        schoolId: auth.schoolId,
        OR: [
          { externalId: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ disabled: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
      take: 20,
      select: {
        externalId: true,
        firstName: true,
        lastName: true,
        photo: true,
        grade: true,
        homeroom: true,
        disabled: true,
        balance: true,
      },
    })

    const scanned = await findStudentByScanId(query)
    const merged =
      scanned && scanned.schoolId === auth.schoolId
        ? [
            scanned,
            ...students.filter((s) => s.externalId !== scanned.externalId),
          ]
        : students

    return NextResponse.json({
      students: merged.slice(0, 20).map((s) => ({
        id: s.externalId,
        firstName: s.firstName,
        lastName: s.lastName,
        photo: s.photo ?? "",
        grade: s.grade,
        homeroom: s.homeroom ?? null,
        disabled: s.disabled,
        balance: Number(s.balance),
      })),
    })
  })
  return result instanceof NextResponse ? result : result
}
