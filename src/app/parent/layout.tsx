import { ParentAgreementGuard } from "@/components/agreements/useAgreementStatus"
import { ParentAuthGuard } from "@/components/auth/ParentAuthGuard"
import { DemoWalkthroughBootstrap } from "@/components/demo/DemoWalkthroughBootstrap"
import { ParentPortalShell } from "@/components/layout/ParentPortalShell"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoWalkthroughBootstrap />
      <ParentAuthGuard>
        <ParentAgreementGuard>
          <div className="parent-portal min-h-screen">
            <ParentPortalShell>{children}</ParentPortalShell>
          </div>
        </ParentAgreementGuard>
      </ParentAuthGuard>
    </>
  )
}
