"use client"

import { Bell } from "lucide-react"
import { Card } from "@/components/ui/card"

export function NotificationCenter({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <Card className="rounded-[20px] border-[#AEB6C2]/60 p-6">
      <div className="flex items-center gap-3">
        <div className="relative rounded-2xl bg-[#041B52]/5 p-3">
          <Bell className="h-5 w-5 text-[#041B52]" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#D62828] text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </div>
        <div>
          <p className="font-semibold text-[#041B52]">Notification Center</p>
          <p className="text-sm text-[#AEB6C2]">
            {unreadCount > 0 ? `${unreadCount} unread alerts` : "No new notifications"}
          </p>
        </div>
      </div>
    </Card>
  )
}
