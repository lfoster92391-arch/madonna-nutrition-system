import { StaffMessagesView } from "@/components/staff/StaffMessagesView"
import { STAFF_BG } from "@/components/staff/layout/staff-theme"

export default function StaffMessagesPage() {
  return (
    <div style={{ backgroundColor: STAFF_BG }}>
      <StaffMessagesView />
    </div>
  )
}
