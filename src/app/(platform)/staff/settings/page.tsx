import { StaffSettingsView } from "@/components/staff/StaffSettingsView"
import { STAFF_BG } from "@/components/staff/layout/staff-theme"

export default function StaffSettingsPage() {
  return (
    <div style={{ backgroundColor: STAFF_BG }}>
      <StaffSettingsView />
    </div>
  )
}
