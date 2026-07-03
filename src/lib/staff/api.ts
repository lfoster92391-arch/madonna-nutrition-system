import { NextResponse } from "next/server"
import { assertStaffUser, StaffAccessError } from "@/lib/auth/staff-access"
import { badRequest, withDatabase } from "@/lib/api/response"

export function staffErrorResponse(error: unknown) {
  if (error instanceof StaffAccessError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
  throw error
}

export async function withStaffAccess<T>(
  staffId: string | null,
  handler: (staff: Awaited<ReturnType<typeof assertStaffUser>>) => Promise<T>
): Promise<T | NextResponse> {
  if (!staffId) {
    return badRequest("staffId is required")
  }

  const result = await withDatabase(async () => {
    try {
      const staff = await assertStaffUser(staffId)
      return await handler(staff)
    } catch (error) {
      return staffErrorResponse(error)
    }
  })

  return result instanceof NextResponse ? result : result
}
