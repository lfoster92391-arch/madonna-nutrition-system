import { NextResponse } from "next/server"
import { badRequest, notFound, withDatabase } from "@/lib/api/response"
import { getParentAgreementStatus, getStudentAgreementStatusById } from "@/lib/agreements/service"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parentUserId = searchParams.get("parentUserId")
  const studentId = searchParams.get("studentId")

  const result = await withDatabase(async () => {
    if (studentId) {
      const status = await getStudentAgreementStatusById(studentId)
      if (!status) return notFound("Student not found")
      return NextResponse.json(status, { headers: NO_STORE })
    }

    if (!parentUserId) {
      return badRequest("parentUserId or studentId is required")
    }

    const status = await getParentAgreementStatus(parentUserId)
    return NextResponse.json(status, { headers: NO_STORE })
  })
  return result instanceof NextResponse ? result : result
}
