"use client"

import Link from "next/link"
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  HelpCircle,
  Link2,
  UserPlus,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import {
  PARENT_CARD,
  PARENT_NAVY,
  PARENT_PAGE_PAD,
  PARENT_SECTION_GAP,
} from "@/components/parent/parent-dashboard-styles"
import { formatSupportNames, SUPPORT_CONTACTS } from "@/config/support-contacts"

const NAVY = PARENT_NAVY

const SECTIONS = [
  {
    id: "account",
    icon: UserPlus,
    title: "1. Create a parent account",
    body: [
      "Go to Parent Access on Fuel The Dons and tap Create an account.",
      "Use your own email and a password you will remember. This login is for parents and guardians — not students.",
      "Staff and teachers who are also parents can use the same school login and switch into the parent portal.",
    ],
  },
  {
    id: "link",
    icon: Link2,
    title: "2. Link / add your student(s)",
    body: [
      "After you sign in, link each child to your account. You need this before balances and lunch orders show up.",
      "Have more than one student? Add each one.",
      "Path: Parent dashboard → Students, or Link a student if you are prompted.",
    ],
  },
  {
    id: "order",
    icon: UtensilsCrossed,
    title: "3. Order meals and save your choices",
    body: [
      "Open Order Lunch from the parent dashboard (or Meal Calendar → Order on a menu day).",
      "Pick the student, a date with a published lunch menu, and the meal (main, side, or milk). On Pizza Day, choose how many slices.",
      "Tap Order lunch. Your choice is saved right away. You will see it under Your Orders / My meal selections.",
      "Regular lunch is $7.00 (Pizza Day is $1.00 per slice).",
    ],
  },
  {
    id: "features",
    icon: BookOpen,
    title: "4. What your parent account can do",
    body: [
      "See student lunch balances and recent meal activity.",
      "Order and review reserved lunches.",
      "Update dietary and allergy information for each student.",
      "Upload or update student photos used on lunch badges (when available).",
      "Read school cafeteria announcements.",
      "Manage profile settings and alert preferences.",
      "Get help from Mrs. Morris or Mrs. Dalfol.",
    ],
  },
  {
    id: "payment",
    icon: Wallet,
    title: "5. How to add lunch money (cash at school)",
    body: [
      "Bring cash in an envelope to school with your student’s name clearly written on it.",
      "Give the envelope to the office. Mrs. Dalfol adds the money to the student lunch account.",
      "Online card payments may also be available in Payments / Add Funds as a secondary option — cash with Mrs. Dalfol is the primary way Madonna families fund lunch accounts.",
    ],
  },
  {
    id: "alerts",
    icon: Bell,
    title: "6. How you get notified in the app",
    body: [
      "Open Settings → Profile / Alerts (or the Alerts / Notifications tile on your dashboard).",
      "You can see low-balance warnings, debt notices, and cafeteria announcements there.",
      "Keep your email and alert preferences up to date so you do not miss important lunch account messages.",
    ],
  },
  {
    id: "selections",
    icon: ClipboardList,
    title: "7. Where to see meals you already chose",
    body: [
      "Go to My meal selections (or Order Lunch → Your Orders).",
      "Each saved choice shows the date, meal type, student name, and status.",
      "You can also open the Meal Calendar to see upcoming published menus and order from there.",
    ],
  },
  {
    id: "publish",
    icon: CalendarDays,
    title: "When can I order?",
    body: [
      "Parents can order only on days the cafeteria has published on the lunch calendar.",
      "If no dates appear under Order Lunch, the menu for those days has not been published yet. Check back after the school posts the week’s menu.",
    ],
  },
] as const

export default function ParentGuidePage() {
  return (
    <div className={`mx-auto w-full max-w-3xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: NAVY }}>
          Fuel The Dons
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ color: NAVY }}>
          Parent how-to guide
        </h1>
        <p className="mt-3 text-base text-[#64748B]">
          Plain steps for Madonna families: accounts, linking students, ordering lunch, payments,
          and notifications.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/parent/reserve-lunch"
            className="rounded-xl bg-[#041B52] px-4 py-2 text-sm font-semibold text-white"
          >
            Order lunch
          </Link>
          <Link
            href="/parent/orders"
            className="rounded-xl border border-[#AEB6C2] bg-white px-4 py-2 text-sm font-semibold text-[#041B52]"
          >
            My meal selections
          </Link>
          <Link
            href="/orientation"
            className="rounded-xl border border-[#AEB6C2] bg-white px-4 py-2 text-sm font-semibold text-[#041B52]"
          >
            Public orientation
          </Link>
        </div>
      </header>

      <nav className={`${PARENT_CARD} p-4 md:p-5`}>
        <p className="mb-3 text-sm font-semibold" style={{ color: NAVY }}>
          Jump to a section
        </p>
        <ul className="flex flex-wrap gap-2">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-block rounded-full border border-[#AEB6C2]/70 px-3 py-1 text-xs font-medium text-[#041B52] hover:bg-[#041B52]/5"
              >
                {section.title.replace(/^\d+\.\s*/, "")}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {SECTIONS.map((section) => {
        const Icon = section.icon
        return (
          <section key={section.id} id={section.id} className={`${PARENT_CARD} scroll-mt-24 p-6 md:p-8`}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#041B52]/5">
                <Icon className="h-5 w-5" style={{ color: NAVY }} aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-bold" style={{ color: NAVY }}>
                  {section.title}
                </h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#475569]">
                  {section.body.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#041B52]/40" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )
      })}

      <section className={`${PARENT_CARD} p-6 md:p-8`}>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#041B52]/5">
            <HelpCircle className="h-5 w-5" style={{ color: NAVY }} aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold" style={{ color: NAVY }}>
              Need help?
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              Email {formatSupportNames()}. Include your name and your student’s name when you can.
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {SUPPORT_CONTACTS.map((c) => (
                <li key={c.email}>
                  <a className="font-medium underline" style={{ color: NAVY }} href={`mailto:${c.email}`}>
                    {c.name}: {c.email}
                  </a>
                </li>
              ))}
            </ul>
            <Link
              href="/parent/help"
              className="mt-4 inline-flex text-sm font-semibold underline"
              style={{ color: NAVY }}
            >
              Open Help &amp; Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
