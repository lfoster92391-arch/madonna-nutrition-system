import { NextResponse } from "next/server"
import { mapUser } from "@/lib/db/mappers"
import { findUserByScanId } from "@/lib/db/users"
import { notFound, serverError, withDatabase } from "@/lib/api/response"

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const q = new URL(request.url).searchParams.get("q") ?? ""
      const user = await findUserByScanId(q)
      if (!user || user.status !== "ACTIVE") {
        return notFound("Staff badge not found")
      }
      if (user.role === "PARENT") {
        return notFound("Staff badge not found")
      }
      return NextResponse.json(mapUser(user))
    } catch (error) {
      console.error("GET /api/users/lookup", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
