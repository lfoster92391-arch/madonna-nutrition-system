import { UserManager } from "@/components/admin/UserManager"
import { StartFreshPanel } from "@/components/admin/StartFreshPanel"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <StartFreshPanel />
      <UserManager />
    </div>
  )
}
