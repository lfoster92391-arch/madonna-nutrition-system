import { NextResponse } from "next/server"
import { badRequest, serverError } from "@/lib/api/response"
import { createReceiptSchema, matchReceiptSchema } from "@/lib/api/validation"
import { createReceiptScan, getReceiptsData, matchReceiptScan } from "@/lib/operations/service"

export async function GET() {
  try {
    const data = await getReceiptsData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("GET /api/receipts", error)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createReceiptSchema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid receipt upload", parsed.error.flatten())
    const result = await createReceiptScan(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("POST /api/receipts", error)
    return serverError()
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const parsed = matchReceiptSchema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid match", parsed.error.flatten())
    const result = await matchReceiptScan(parsed.data.id, parsed.data.receivingId, parsed.data.approve)
    return NextResponse.json(result)
  } catch (error) {
    console.error("PATCH /api/receipts", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}
