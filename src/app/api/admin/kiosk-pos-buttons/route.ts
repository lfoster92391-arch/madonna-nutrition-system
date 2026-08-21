import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/api/admin-auth"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { prisma } from "@/lib/prisma"
import {
  isSystemMainMealKey,
  listKioskPosButtons,
  slugifyCustomKey,
} from "@/lib/kiosk/pos-buttons"
import { STUDENT_LUNCH_PRICE } from "@/config/onboarding-pricing"

const createSchema = z.object({
  adminUserId: z.string().min(1).optional(),
  label: z.string().min(1).max(80),
  price: z.number().nonnegative().max(500),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
  audience: z.enum(["STUDENT", "STAFF", "BOTH", "CASHIER_ONLY"]).default("BOTH"),
  category: z.enum(["MEAL", "DRINK", "ALA_CARTE", "CUSTOM"]).default("CUSTOM"),
  grades: z.array(z.string().max(8)).max(20).optional(),
})

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    const adminUserId =
      request.headers.get("x-admin-user-id") ?? request.headers.get("x-session-user-id")
    const auth = await requireAdmin(adminUserId, request)
    if ("error" in auth) return auth.error

    const buttons = await listKioskPosButtons(auth.schoolId, { activeOnly: false })
    return NextResponse.json({ buttons })
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = createSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid kiosk button payload", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId, request)
      if ("error" in auth) return auth.error

      const maxSort = await prisma.kioskPosButton.aggregate({
        where: { schoolId: auth.schoolId },
        _max: { sortOrder: true },
      })

      const created = await prisma.kioskPosButton.create({
        data: {
          schoolId: auth.schoolId,
          key: slugifyCustomKey(parsed.data.label),
          label: parsed.data.label.trim(),
          price: parsed.data.price,
          sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 10,
          active: parsed.data.active ?? true,
          audience: parsed.data.audience,
          category: parsed.data.category,
          grades: parsed.data.grades ?? [],
          isSystem: false,
        },
      })

      const buttons = await listKioskPosButtons(auth.schoolId, { activeOnly: false })
      return NextResponse.json(
        { button: buttons.find((b) => b.id === created.id), buttons },
        { status: 201 }
      )
    } catch (error) {
      console.error("POST /api/admin/kiosk-pos-buttons", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

/** Re-seed missing defaults (does not overwrite admin edits). */
export async function PUT(request: Request) {
  const result = await withDatabase(async () => {
    const adminUserId =
      request.headers.get("x-admin-user-id") ?? request.headers.get("x-session-user-id")
    const auth = await requireAdmin(adminUserId, request)
    if ("error" in auth) return auth.error

    // Ensure defaults exist; sync system meal stored price to canonical lunch price for display in admin.
    const buttons = await listKioskPosButtons(auth.schoolId, { activeOnly: false })
    const systemIds = buttons.filter((b) => isSystemMainMealKey(b.key)).map((b) => b.id)
    if (systemIds.length > 0) {
      await prisma.kioskPosButton.updateMany({
        where: { id: { in: systemIds }, schoolId: auth.schoolId },
        data: { price: STUDENT_LUNCH_PRICE },
      })
    }
    const refreshed = await listKioskPosButtons(auth.schoolId, { activeOnly: false })
    return NextResponse.json({ buttons: refreshed })
  })
  return result instanceof NextResponse ? result : result
}
