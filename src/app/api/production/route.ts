import { NextResponse } from "next/server"
import { badRequest, serverError } from "@/lib/api/response"
import { updateProductionSchema } from "@/lib/api/validation"
import { getProductionData, updateProductionOrder } from "@/lib/operations/service"

export async function GET() {
  try {
    const data = await getProductionData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("GET /api/production", error)
    return serverError()
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const parsed = updateProductionSchema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid update", parsed.error.flatten())
    const { id, ...updates } = parsed.data
    const result = await updateProductionOrder(id, updates)
    return NextResponse.json(result)
  } catch (error) {
    console.error("PATCH /api/production", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}
