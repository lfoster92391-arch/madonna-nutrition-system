import { NextResponse } from "next/server"
import { badRequest } from "@/lib/api/response"
import { verifyKioskCashierPin } from "@/lib/kiosk/pin"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: unknown }
    const pin = typeof body.pin === "string" ? body.pin.trim() : ""
    if (!/^\d{4}$/.test(pin)) return badRequest("Enter a 4-digit PIN")

    if (!verifyKioskCashierPin(pin)) {
      return NextResponse.json({ ok: false, error: "Incorrect PIN. Try again." }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return badRequest("Invalid request")
  }
}
