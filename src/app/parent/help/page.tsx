import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PARENT_CARD, PARENT_NAVY, PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"
import {
  getItHelpDeskMailto,
  IT_HELP_DESK_EMAIL,
  IT_HELP_DESK_LABEL,
} from "@/config/it-help"

export default function HelpPage() {
  return (
    <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
      <header>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: PARENT_NAVY }}>
          Help &amp; Support
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Contact {IT_HELP_DESK_LABEL} for account or cafeteria portal questions.
        </p>
      </header>
      <div className={`${PARENT_CARD} p-6 md:p-8`}>
        <p className="text-sm text-[#64748B]">
          Email{" "}
          <a href={getItHelpDeskMailto()} className="font-medium" style={{ color: PARENT_NAVY }}>
            {IT_HELP_DESK_LABEL}
          </a>{" "}
          at{" "}
          <a href={getItHelpDeskMailto()} className="font-medium" style={{ color: PARENT_NAVY }}>
            {IT_HELP_DESK_EMAIL}
          </a>
          .
        </p>
        <Button asChild variant="outline" className="mt-6 rounded-[10px] border-[#C8CDD7]" style={{ color: PARENT_NAVY }}>
          <Link href="/parent">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
