import { NextResponse } from "next/server"
import { badRequest, serverError } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { groceryPurchaseSchema } from "@/lib/api/validation"
import { getReceivingData, recordGroceryPurchase } from "@/lib/operations/service"

export async function GET() {
  try {
    const data = await getReceivingData()
    const groceries = data.records
      .filter((r) => r.status === "approved")
      .map((r) => {
        const lineTotal = r.lines.reduce((sum, line) => {
          const total =
            typeof (line as { totalCost?: number }).totalCost === "number"
              ? (line as { totalCost: number }).totalCost
              : (line.unitCost ?? 0) * line.quantity
          return sum + total
        }, 0)
        return {
          id: r.id,
          vendorName: r.vendorName,
          purchasedAt: r.receivedAt ?? r.approvedAt ?? r.createdAt,
          notes: r.notes,
          lines: r.lines,
          totalCost: Math.round(lineTotal * 100) / 100,
        }
      })
      .sort(
        (a, b) =>
          new Date(b.purchasedAt ?? 0).getTime() - new Date(a.purchasedAt ?? 0).getTime()
      )

    return NextResponse.json({
      source: data.source,
      groceries,
      monthSpend: groceries
        .filter((g) => {
          const d = new Date(g.purchasedAt ?? 0)
          const now = new Date()
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
        })
        .reduce((s, g) => s + g.totalCost, 0),
    })
  } catch (error) {
    console.error("GET /api/groceries", error)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMutatingSession(request, ["ADMIN", "STAFF", "CASHIER"])
    if ("error" in auth) return auth.error

    const body = await request.json()
    const parsed = groceryPurchaseSchema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid grocery purchase", parsed.error.flatten())

    const result = await recordGroceryPurchase({
      ...parsed.data,
      createdBy:
        `${auth.user.firstName} ${auth.user.lastName}`.trim() ||
        auth.user.username ||
        "Financials",
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("POST /api/groceries", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}
