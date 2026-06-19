import { Suspense } from "react"
import { FamilySettingsPage } from "@/components/parent/settings/FamilySettingsPage"

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-white" />}>
      <FamilySettingsPage />
    </Suspense>
  )
}
