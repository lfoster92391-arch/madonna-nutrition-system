import { PARENT_CARD, PARENT_NAVY, PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"
import { SupportContactList } from "@/components/support/SupportNeedHelp"
import { formatSupportNames } from "@/config/support-contacts"

export default function HelpPage() {
  return (
    <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
      <header>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: PARENT_NAVY }}>
          Help &amp; Support
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Contact {formatSupportNames()} for account or cafeteria portal questions.
        </p>
      </header>
      <div className={`${PARENT_CARD} p-6 md:p-8`}>
        <SupportContactList linkStyle={{ color: PARENT_NAVY }} />
      </div>
    </div>
  )
}
