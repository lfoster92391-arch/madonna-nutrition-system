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
      description="Configure student scan badges, ID photos, and mass-print badge sheets for cafeteria stations."
      icon={IdCard}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-silver/60 bg-white p-4 shadow-sm">
        <p className="text-sm text-silver-foreground">
          Badge photos come from each student&apos;s profile. To add or change a photo:{" "}
          <Link href="/admin/imports" className="font-semibold text-primary underline">
            Students
          </Link>{" "}
          → Open profile → Take photo or Upload photo → Save. Barcode format: 4–6 digits.
        </p>
        <Button asChild>
          <Link href="/scan">
            <ScanLine className="mr-2 h-4 w-4" />
            Open Cashier / Scan Station
          </Link>
        </Button>
      </div>
      <BadgeManager />
    </AdminModulePage>
  )
}
