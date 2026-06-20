import { NextResponse } from "next/server"
import { mapVendor } from "@/lib/procurement/vendors"
import { vendorSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { prisma } from "@/lib/prisma"

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["ADMIN"])
      if ("error" in auth) return auth.error

      const { id } = await params
      const body = await request.json()
      const parsed = vendorSchema.partial().safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid vendor update", parsed.error.flatten())
      }

      const existing = await prisma.vendor.findFirst({
        where: { id, schoolId: auth.schoolId },
      })
      if (!existing) return notFound("Vendor not found")

      const vendor = await prisma.vendor.update({
        where: { id },
        data: {
          ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
          ...(parsed.data.contactName !== undefined
            ? { contactName: parsed.data.contactName?.trim() || null }
            : {}),
          ...(parsed.data.email !== undefined
            ? { email: parsed.data.email?.trim() || null }
            : {}),
          ...(parsed.data.phone !== undefined
            ? { phone: parsed.data.phone?.trim() || null }
            : {}),
          ...(parsed.data.category !== undefined
            ? { category: parsed.data.category?.trim() || null }
            : {}),
          ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
        },
      })

      return NextResponse.json(mapVendor(vendor))
    } catch (error) {
      console.error("PATCH /api/vendors/[id]", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    const auth = await requireMutatingSession(request, ["ADMIN"])
    if ("error" in auth) return auth.error

    const { id } = await params
    const existing = await prisma.vendor.findFirst({
      where: { id, schoolId: auth.schoolId },
    })
    if (!existing) return notFound("Vendor not found")

    await prisma.vendor.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  })
  return result instanceof NextResponse ? result : result
}
