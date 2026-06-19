import { ParentAgreementGuard } from "@/components/agreements/useAgreementStatus"
import { ParentAuthGuard } from "@/components/auth/ParentAuthGuard"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ParentAuthGuard>
      <ParentAgreementGuard>
        <div className="parent-portal min-h-screen bg-white">{children}</div>
      </ParentAgreementGuard>
    </ParentAuthGuard>
  )
}
