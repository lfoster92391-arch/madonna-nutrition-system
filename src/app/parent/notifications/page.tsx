import { Suspense } from "react"
import { ParentNotificationsPage } from "@/components/parent/ParentNotificationsPage"

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-white" />}>
      <ParentNotificationsPage />
    </Suspense>
  )
}
