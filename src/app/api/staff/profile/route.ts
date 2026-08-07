import { NextResponse } from "next/server"
import { withStaffAccess } from "@/lib/staff/api"

export async function GET(request: Request) {
  const staffId = new URL(request.url).searchParams.get("staffId")
  return withStaffAccess(staffId, async (staff) => {
    return NextResponse.json({
      profile: {
        id: staff.id,
        displayName: staff.displayName,
        email: staff.email,
        department: staff.department,
        accountBalance: staff.accountBalance,
        linkedStudentIds: staff.linkedStudentIds,
      },
    })
  })
}
