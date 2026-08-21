import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/api/admin-auth"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { prisma } from "@/lib/prisma"
import {
  isSystemMainMealKey,
  listKioskPosButtons,
  mapKioskPosButton,
} from "@/lib/kiosk/pos-buttons"
import { STUDENT_LUNCH_PRICE } from "@/config/onboarding-pricing"

const patchSchema = z.object({
  adminUserId: z.string().min(1).optional(),
  label: z.string().min(1).max(80).optional(),
  price: z.number().nonnegative().max(500).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
  audience: z.enum(["STUDENT", "STAFF", "BOTH", "CASHIER_ONLY"]).optional(),
  category: z.enum(["MEAL", "DRINK", "ALA_CARTE", "CUSTOM"]).optional(),
  grades: z.array(z.string().max(8)).max(20).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export const dynamic = "force-dynamic"

export async function PATCH(request: Request, context: RouteContext) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await context.params
      const body = await request.json()
      const parsed = patchSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid kiosk button update", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId, request)
      if ("error" in auth) return auth.error

      const existing = await prisma.kioskPosButton.findFirst({
        where: { id, schoolId: auth.schoolId },
      })
      if (!existing) return notFound("Button not found")

      const priceLocked = existing.isSystem && isSystemMainMealKey(existing.key)
      const nextPrice = priceLocked
        ? STUDENT_LUNCH_PRICE
        : parsed.data.price !== undefined
          ? parsed.data.price
          : undefined

      const updated = await prisma.kioskPosButton.update({
        where: { id: existing.id },
        data: {
          ...(parsed.data.label !== undefined ? { label: parsed.data.label.trim() } : {}),
          ...(nextPrice !== undefined ? { price: nextPrice } : {}),
          ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
          ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
          ...(parsed.data.audience !== undefined ? { audience: parsed.data.audience } : {}),
          ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
          ...(parsed.data.grades !== undefined ? { grades: parsed.data.grades } : {}),
        },
      })

      const buttons = await listKioskPosButtons(auth.schoolId, { activeOnly: false })
      return NextResponse.json({
        button: mapKioskPosButton(updated),
        buttons,
      })
    } catch (error) {
      console.error("PATCH /api/admin/kiosk-pos-buttons/[id]", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

export async function DELETE(request: Request, context: RouteContext) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await context.params
      const adminUserId =
        request.headers.get("x-admin-user-id") ?? request.headers.get("x-session-user-id")
      const auth = await requireAdmin(adminUserId, request)
      if ("error" in auth) return auth.error

      const existing = await prisma.kioskPosButton.findFirst({
        where: { id, schoolId: auth.schoolId },
      })
      if (!existing) return notFound("Button not found")

      if (existing.isSystem) {
        // Soft-hide system buttons instead of deleting (can re-enable later).
        await prisma.kioskPosButton.update({
          where: { id: existing.id },
          data: { active: false },
        })
      } else {
        await prisma.kioskPosButton.delete({ where: { id: existing.id } })
      }

      const buttons = await listKioskPosButtons(auth.schoolId, { activeOnly: false })
      return NextResponse.json({ ok: true, buttons })
    } catch (error) {
      console.error("DELETE /api/admin/kiosk-pos-buttons/[id]", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
