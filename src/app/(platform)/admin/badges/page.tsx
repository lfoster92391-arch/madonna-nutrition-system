import Link from "next/link"
import { IdCard, ScanLine } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { BadgeManager } from "@/components/admin/BadgeManager"
import { Button } from "@/components/ui/button"

export default function AdminBadgesPage() {
  return (
    <AdminModulePage
      section="Get Started"
      title="Badge Setup"
      description="Configure student and staff scan badges, ID photos, and mass-print badge sheets for cafeteria stations."
      icon={IdCard}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-silver/60 bg-white p-3 shadow-sm sm:mb-6 sm:p-4">
        <p className="min-w-0 text-sm text-silver-foreground">
          Student photos:{" "}
          <Link href="/admin/imports" className="font-semibold text-primary underline">
            Students
          </Link>{" "}
          → Open profile → Take photo or Upload → Save. Staff &amp; teacher photos:{" "}
          <Link href="/admin/imports?tab=staff" className="font-semibold text-primary underline">
            Staff directory
          </Link>{" "}
          → Open profile → Take photo or Upload → Save photo. Barcode format: 4–6 digits.
        </p>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/scan">
            <ScanLine className="mr-2 h-4 w-4" />
            Open Cashier / POS
          </Link>
        </Button>
      </div>
      <BadgeManager />
    </AdminModulePage>
  )
}
