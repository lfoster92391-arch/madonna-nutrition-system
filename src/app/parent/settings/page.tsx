import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { FamilySettingsPage } from "@/components/parent/settings/FamilySettingsPage"

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <FamilySettingsPage />
    </Suspense>
  )
}
