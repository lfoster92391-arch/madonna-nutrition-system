"use client"

import Image from "next/image"
import { CheckCircle2 } from "lucide-react"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/data/demo/teacher"
import { formatCurrency } from "@/lib/utils"
import type { TeacherPaymentMethod } from "@/lib/teacher/types"

const PAYMENT_LABELS: Record<TeacherPaymentMethod, string> = {
  account: "Account",
  prepay_online: "Prepay Online",
  pay_at_kiosk: "Pay At Kiosk",
}

export function MyLunchToday() {
  const { reservation, updateTeacherReservation } = useTeacherData()

  if (!reservation || reservation.status === "cancelled") {
    return (
      <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
        <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
          My Lunch Today
        </h2>
        <p className="mt-4 text-sm text-silver-foreground">No lunch reserved for today.</p>
        <Button
          className="mt-4"
          onClick={() => updateTeacherReservation("account", "reserve")}
        >
          Reserve Lunch
        </Button>
      </Card>
    )
  }

  return (
    <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
      <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
        My Lunch Today
      </h2>
      <div className="mt-4 flex gap-4">
        <Image
          src={reservation.mealPhotoUrl}
          alt={reservation.mealName}
          width={120}
          height={120}
          className="h-28 w-28 rounded-2xl object-cover"
        />
        <div className="flex-1">
          <p className="text-lg font-semibold" style={{ color: TEACHER_NAVY }}>
            {reservation.mealName}
          </p>
          <p className="text-sm font-medium text-silver-foreground">
            {formatCurrency(reservation.mealPrice)}
          </p>
          <p className="mt-2 text-sm text-silver-foreground">
            Paid with: {PAYMENT_LABELS[reservation.paymentMethod]}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            Reserved
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateTeacherReservation("prepay_online", "change")}
        >
          Change or Cancel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateTeacherReservation(reservation.paymentMethod, "cancel")}
        >
          Cancel
        </Button>
      </div>
    </Card>
  )
}
