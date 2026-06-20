import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/api/admin-auth"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  adminUserId: z.string().min(1),
  title: z.string().min(2),
  body: z.string().min(2),
  audience: z.enum(["PARENTS", "TEACHERS", "ALL"]).default("ALL"),
})

function mapAnnouncement(row: {
  id: string
  title: string
  body: string
  audience: string
  publishedBy: string | null
  createdAt: Date
}) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    publishedBy: row.publishedBy,
    date: row.createdAt.toISOString().slice(0, 10),
    createdAt: row.createdAt.toISOString(),
  }
}

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    const { searchParams } = new URL(request.url)
    const audience = searchParams.get("audience")
    const schoolId = await resolveSchoolId()

    const audienceFilter =
      audience === "parents"
        ? { in: ["PARENTS" as const, "ALL" as const] }
        : audience === "teachers"
          ? { in: ["TEACHERS" as const, "ALL" as const] }
          : undefined

    const announcements = await prisma.announcement.findMany({
      where: {
        schoolId,
        ...(audienceFilter ? { audience: audienceFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ announcements: announcements.map(mapAnnouncement) })
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = createSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid announcement payload", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId)
      if ("error" in auth) return auth.error

      const announcement = await prisma.announcement.create({
        data: {
          title: parsed.data.title,
          body: parsed.data.body,
          audience: parsed.data.audience,
          publishedBy: auth.admin.firstName
            ? `${auth.admin.firstName} ${auth.admin.lastName}`
            : "Admin",
          schoolId: auth.schoolId,
        },
      })

      return NextResponse.json({ announcement: mapAnnouncement(announcement) }, { status: 201 })
    } catch (error) {
      console.error("POST /api/announcements", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
