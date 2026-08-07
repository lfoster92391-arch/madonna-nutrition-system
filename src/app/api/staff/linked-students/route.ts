import { NextResponse } from "next/server"
import { withStaffAccess } from "@/lib/staff/api"
import { getStaffLinkedStudents } from "@/lib/auth/staff-links"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const staffId = new URL(request.url).searchParams.get("staffId")
  return withStaffAccess(staffId, async (staff) => {
    const students = await getStaffLinkedStudents(staff.id)
    return NextResponse.json({ students })
  })
}
