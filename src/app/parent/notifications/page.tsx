"use client"

import { ModuleShell } from "@/components/layout/ModuleShell"
import { NotificationCenter } from "@/components/notifications/NotificationCenter"
import { Card } from "@/components/ui/card"

export default function ParentNotificationsPage() {
  return (
    <ModuleShell section="Parent Portal" title="Notifications" description="Balance alerts, menu updates, and allergy messages.">
      <NotificationCenter unreadCount={2} />
      <Card className="mt-6 rounded-[20px] border-[#AEB6C2]/60 p-8">
        <p className="text-[#041B52]">Update delivery preferences in Settings.</p>
      </Card>
    </ModuleShell>
  )
}
