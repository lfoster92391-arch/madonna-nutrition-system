import Link from "next/link"
import { IdCard, ScanLine } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Button } from "@/components/ui/button"

export default function AdminBadgesPage() {
  return (
    <AdminModulePage
      section="Get Started"
      title="Badge Setup"
      description="Configure student scan badges and ID photos for cafeteria stations."
      icon={IdCard}
    >
      <div className="rounded-2xl border border-silver/60 bg-white p-8 shadow-sm">
        <p className="text-silver-foreground">
          Manage badge enrollment, photo capture, and scan station readiness from the cashier portal.
        </p>
        <Button asChild className="mt-6">
          <Link href="/scan">
            <ScanLine className="mr-2 h-4 w-4" />
            Open Cashier / Scan Station
          </Link>
        </Button>
      </div>
    </AdminModulePage>
  )
}
