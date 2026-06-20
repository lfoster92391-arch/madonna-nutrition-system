"use client"

import { CheckCircle2, Clock, MapPin } from "lucide-react"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/config/teacher-theme"
import { formatCurrency } from "@/lib/utils"

export function PickupPaymentCard() {
  const { reservation, profile } = useTeacherData()

  return (
    <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: TEACHER_NAVY }}>
            Pickup Details
          </h3>
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex items-center gap-2" style={{ color: TEACHER_NAVY }}>
              <MapPin className="h-4 w-4" style={{ color: "#AEB6C2" }} />
              {reservation?.pickupLocation ?? "Main Cafeteria"}
            </p>
            <p className="flex items-center gap-2" style={{ color: TEACHER_NAVY }}>
              <Clock className="h-4 w-4" style={{ color: "#AEB6C2" }} />
              {reservation?.pickupStart ?? "11:15 AM"} – {reservation?.pickupEnd ?? "1:15 PM"}
            </p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: TEACHER_NAVY }}>
            Payment Method
          </h3>
          <div className="mt-3">
            <p className="flex items-center gap-2 text-sm font-medium" style={{ color: TEACHER_NAVY }}>
              <CheckCircle2 className="h-4 w-4 text-success" />
              Using Account Funds
            </p>
            <p className="mt-1 text-sm text-success">Good Standing</p>
            <p className="mt-2 text-sm font-semibold" style={{ color: TEACHER_NAVY }}>
              Your balance: {formatCurrency(profile?.accountBalance ?? 0)}
            </p>
          </div>
        </div>
      </div>
      <div
        className="mt-6 rounded-2xl border px-5 py-4"
        style={{ borderColor: "#AEB6C2", backgroundColor: "#f8f9fb" }}
      >
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#AEB6C2" }}>
          Today&apos;s Cutoff
        </p>
        <p className="mt-1 flex items-center gap-2 text-3xl font-bold" style={{ color: TEACHER_NAVY }}>
          <Clock className="h-8 w-8" style={{ color: "#AEB6C2" }} />
          {reservation?.cutoffTime ?? "10:00 AM"}
        </p>
        <p className="mt-1 text-sm text-silver-foreground">
          Changes must be made before this time.
        </p>
      </div>
    </Card>
  )
}
