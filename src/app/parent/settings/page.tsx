import Link from "next/link"
import { ParentSectionPage } from "@/components/parent/ParentSectionPage"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <ParentSectionPage
      title="Settings"
      description="Manage notification preferences and account settings."
    >
      <div className="rounded-[20px] border border-silver/60 bg-white p-6">
        <h2 className="text-lg font-bold text-primary">Payments</h2>
        <p className="mt-2 text-sm text-silver-foreground">
          Manage payment methods or use the full deposit page for multi-student funding.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/parent/payments?tab=methods">Payment methods</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/parent/add-funds">Deposit Funds</Link>
          </Button>
        </div>
      </div>
    </ParentSectionPage>
  )
}
