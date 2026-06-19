import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PARENT_CARD, PARENT_NAVY, PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"

export default function HelpPage() {
  return (
    <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
      <header>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: PARENT_NAVY }}>
          Help &amp; Support
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Contact Nutrition Services for account or cafeteria questions.
        </p>
      </header>
      <div className={`${PARENT_CARD} p-6 md:p-8`}>
        <p className="text-sm text-[#64748B]">
          Email{" "}
          <a href="mailto:nutrition@madonnahs.org" className="font-medium" style={{ color: PARENT_NAVY }}>
            nutrition@madonnahs.org
          </a>{" "}
          or call (304) 748-4414.
        </p>
        <Button asChild variant="outline" className="mt-6 rounded-[10px] border-[#C8CDD7]" style={{ color: PARENT_NAVY }}>
          <Link href="/parent">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
