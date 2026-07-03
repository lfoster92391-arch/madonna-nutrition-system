import { StaffAuthGuard } from "@/components/auth/StaffAuthGuard"
import { MustChangePasswordGate } from "@/components/auth/MustChangePasswordGate"
import { StaffDataProvider } from "@/components/providers/StaffDataProvider"
import { StaffLayoutShell } from "@/components/staff/layout/StaffLayoutShell"

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffAuthGuard>
      <StaffDataProvider>
        <MustChangePasswordGate>
          <StaffLayoutShell>{children}</StaffLayoutShell>
        </MustChangePasswordGate>
      </StaffDataProvider>
    </StaffAuthGuard>
  )
}
