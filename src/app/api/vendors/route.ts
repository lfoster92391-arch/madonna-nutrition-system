import { NextResponse } from "next/server"
import { listVendors, mapVendor } from "@/lib/procurement/vendors"
import { resolveSchoolId } from "@/lib/db/school"
import { vendorSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const result = await withDatabase(async () => {
    const vendors = await listVendors()
    return NextResponse.json(vendors)
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["ADMIN"])
      if ("error" in auth) return auth.error

      const body = await request.json()
      const parsed = vendorSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid vendor payload", parsed.error.flatten())
      }

      const schoolId = await resolveSchoolId()
      const vendor = await prisma.vendor.create({
        data: {
          name: parsed.data.name.trim(),
          contactName: parsed.data.contactName?.trim() || undefined,
          email: parsed.data.email?.trim() || undefined,
          phone: parsed.data.phone?.trim() || undefined,
          category: parsed.data.category?.trim() || undefined,
          active: parsed.data.active ?? true,
          schoolId,
        },
      })

      return NextResponse.json(mapVendor(vendor), { status: 201 })
    } catch (error) {
      console.error("POST /api/vendors", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
