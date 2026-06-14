import { NextResponse } from "next/server"
import { badRequest, serverError } from "@/lib/api/response"
import { createReceivingSchema, updateReceivingSchema } from "@/lib/api/validation"
import {
  createReceivingRecord,
  getReceivingData,
  lookupBarcode,
  updateReceivingRecord,
} from "@/lib/operations/service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get("barcode")
    if (barcode) {
      const item = await lookupBarcode(barcode)
      return NextResponse.json({ item })
    }
    const data = await getReceivingData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("GET /api/receiving", error)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createReceivingSchema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid receiving record", parsed.error.flatten())
    const result = await createReceivingRecord(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("POST /api/receiving", error)
    return serverError()
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const parsed = updateReceivingSchema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid update", parsed.error.flatten())
    const result = await updateReceivingRecord(
      parsed.data.id,
      parsed.data.action,
      parsed.data.approvedBy,
      parsed.data.storageLocationId
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error("PATCH /api/receiving", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}
