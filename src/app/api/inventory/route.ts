import { NextResponse } from "next/server"
import { badRequest, serverError } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { inventoryMovementSchema } from "@/lib/api/validation"
import { getInventoryData, recordInventoryMovement } from "@/lib/operations/service"

export async function GET() {
  try {
    const data = await getInventoryData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("GET /api/inventory", error)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMutatingSession(request, ["ADMIN", "STAFF", "CASHIER"])
    if ("error" in auth) return auth.error

    const body = await request.json()

    if (body.action === "movement") {
      const parsed = inventoryMovementSchema.safeParse(body)
      if (!parsed.success) return badRequest("Invalid movement", parsed.error.flatten())
      const result = await recordInventoryMovement(parsed.data)
      return NextResponse.json(result, { status: 201 })
    }

    return badRequest("Unknown action")
  } catch (error) {
    console.error("POST /api/inventory", error)
    return serverError()
  }
}
