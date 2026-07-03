import { ParentAgreementGuard } from "@/components/agreements/useAgreementStatus"
import { ParentAuthGuard } from "@/components/auth/ParentAuthGuard"
import { MustChangePasswordGate } from "@/components/auth/MustChangePasswordGate"
import { ParentPortalShell } from "@/components/layout/ParentPortalShell"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ParentAuthGuard>
      <MustChangePasswordGate>
        <ParentAgreementGuard>
          <div className="parent-portal min-h-screen">
            <ParentPortalShell>{children}</ParentPortalShell>
          </div>
        </ParentAgreementGuard>
      </MustChangePasswordGate>
    </ParentAuthGuard>
  )
}
