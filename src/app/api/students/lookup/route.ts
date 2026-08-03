import { NextResponse } from "next/server"
import { mapStudent } from "@/lib/db/mappers"
import { findStudentByScanId } from "@/lib/db/students"
import { notFound, serverError, withDatabase } from "@/lib/api/response"

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const q = new URL(request.url).searchParams.get("q") ?? ""
      const student = await findStudentByScanId(q)
      if (!student || student.disabled) {
        return notFound("Student not found")
      }
      return NextResponse.json(mapStudent(student))
    } catch (error) {
      console.error("GET /api/students/lookup", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}