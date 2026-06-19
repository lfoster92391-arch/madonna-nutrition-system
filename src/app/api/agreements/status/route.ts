import { NextResponse } from "next/server"
import { badRequest, notFound, withDatabase } from "@/lib/api/response"
import { getParentAgreementStatus, getStudentAgreementStatusById } from "@/lib/agreements/service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parentUserId = searchParams.get("parentUserId")
  const studentId = searchParams.get("studentId")

  const result = await withDatabase(async () => {
    if (studentId) {
      const status = await getStudentAgreementStatusById(studentId)
      if (!status) return notFound("Student not found")
      return NextResponse.json(status)
    }

    if (!parentUserId) {
      return badRequest("parentUserId or studentId is required")
    }

    try {
      const status = await getParentAgreementStatus(parentUserId)
      return NextResponse.json(status)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load agreement status"
      return badRequest(message)
    }
  })
  return result instanceof NextResponse ? result : result
}
