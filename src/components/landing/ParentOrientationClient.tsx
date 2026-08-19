"use client"

import Link from "next/link"
import {
  CreditCard,
  HelpCircle,
  Link2,
  Lock,
  Pizza,
  ShieldCheck,
  UserPlus,
  UtensilsCrossed,
} from "lucide-react"
import { LandingShell } from "@/components/landing/LandingShell"
import { ParentDashboardPreviews } from "@/components/landing/ParentDashboardPreviews"
import { BRAND } from "@/config/brand"
import { formatSupportDirectory, formatSupportNames, getSupportMailto, SUPPORT_CONTACTS } from "@/config/support-contacts"
import { CARD_SAFETY_COPY_SHORT } from "@/lib/security/card-copy"
import { formatCurrency } from "@/lib/utils"

const NAVY = "#041B52"
const GREEN = "#0D7A3B"
const PARENT_ACCENT = "#0B2D8F"

const STEPS = [
  {
    number: 1,
    title: "Create a parent account",
    plain: "Start at Parent Access. Tap Create an account.",
    details: [
      "Use your own email and a password you will remember.",
      "This account is for parents and guardians - not students.",
    ],
    icon: UserPlus,
  },
  {
    number: 2,
    title: "Link your student(s)",
    plain: "Required. You can link more than one child.",
    details: [
      "After you sign in, link each student to your account.",
      "You need this step before balances, funds, or lunch orders show up.",
      "Have more than one student? Add each one.",
    ],
    icon: Link2,
  },
  {
    number: 3,
    title: "See balances & add funds",
    plain: "Check lunch money. Add more anytime with a card.",
    details: [
      "Open a student to see their balance.",
      "Add funds with a card through Stripe each time.",
      CARD_SAFETY_COPY_SHORT,
    ],
    icon: CreditCard,
  },
  {
    number: 4,
    title: "Order lunch",
    plain: "Reserve meals. Order Pizza Day slices when it applies.",
    details: [
      "Regular lunch is $7.00.",
      "Use Order Lunch for regular meal days.",
      "On Pizza Day, choose how many slices you want ($1.00 each).",
      "Orders use the student's lunch balance.",
    ],
    icon: UtensilsCrossed,
    pizzaNote: true,
  },
  {
    number: 5,
    title: "Need help?",
    plain: `Email ${formatSupportNames()}. We are happy to help.`,
    details: [
      ...SUPPORT_CONTACTS.map((c) => `${c.name}: ${c.email}`),
      "Include your name and your student's name if you can.",
    ],
    icon: HelpCircle,
    help: true,
  },
] as const

const SAFETY_FAQS = [
  {
    q: "Is my credit card safe?",
    a: "Yes. We never store your card number. Each time you add funds, Stripe handles the payment securely. Your full card number does not stay in Fuel The Dons.",
  },
  {
    q: "Why do I re-enter my card each time?",
    a: "On purpose - for your safety. Entering the card fresh through Stripe means we do not keep card numbers on file. It takes a moment and protects your family.",
  },
  {
    q: "Is the website secure?",
    a: "Yes. The site uses encrypted HTTPS connections. Unusual activity can trigger security alerts to Mrs. Morris so issues are reviewed quickly.",
  },
  {
    q: "Who can see my student's information?",
    a: "You must link your student to your parent account first. Without that link, you cannot open their lunch account. Other parents cannot see your kids.",
  },
  {
    q: "Who can see my kids' balances?",
    a: "Only you (on the linked parent account) and authorized school cafeteria staff who need it to run lunch. Other families cannot see your balances.",
  },
  {
    q: "How do I get help?",
    a: `Email ${formatSupportDirectory()}. Include your name and your student's name when you can.`,
  },
] as const

function stepAccent(step: (typeof STEPS)[number]): string {
  return "help" in step && step.help ? GREEN : PARENT_ACCENT
}

function stepNumberBg(step: (typeof STEPS)[number]): string {
  return "help" in step && step.help ? GREEN : NAVY
}

export function ParentOrientationClient() {
  return (
    <LandingShell align="start" contentMaxClassName="max-w-[1180px]">
      <header className="mb-6 w-full min-w-0 text-center md:mb-8">
        <p
          className="text-lg font-bold uppercase tracking-[0.2em] sm:text-xl md:text-2xl"
          style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.55)" }}
        >
          {BRAND.productName}
        </p>
        <h1
          className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl"
          style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
        >
          Parent Orientation
        </h1>
        <p
          className="mx-auto mt-3 max-w-2xl text-base font-medium leading-snug text-gray-700 sm:text-lg md:text-xl"
          style={{ textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}
        >
          Five simple steps to manage lunch for your family.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/access/parent"
            className="inline-flex min-h-14 w-full max-w-sm items-center justify-center rounded-2xl px-6 text-lg font-bold text-white shadow-[0_8px_24px_rgba(4,27,82,0.22)] transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#041B52] focus-visible:ring-offset-2 sm:w-auto sm:min-w-[220px]"
            style={{ backgroundColor: PARENT_ACCENT }}
          >
            Start here - Parent Access
          </Link>
          <Link
            href="/login/parent/register"
            className="inline-flex min-h-14 w-full max-w-sm items-center justify-center rounded-2xl border-2 bg-white/90 px-6 text-lg font-bold transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#041B52] focus-visible:ring-offset-2 sm:w-auto sm:min-w-[220px]"
            style={{ color: NAVY, borderColor: NAVY }}
          >
            Create an account
          </Link>
        </div>
        <p className="mt-4">
          <a
            href="#safety"
            className="inline-flex min-h-11 items-center gap-2 text-base font-semibold underline-offset-2 hover:underline sm:text-lg"
            style={{ color: NAVY }}
          >
            <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden />
            Your questions about safety
          </a>
        </p>
      </header>

      <ol className="flex w-full min-w-0 flex-col gap-4 text-left sm:gap-5">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <li
              key={step.number}
              className="landing-card-enter overflow-hidden rounded-2xl border border-white/40 bg-white/94 shadow-[0_8px_28px_rgba(4,27,82,0.14)] backdrop-blur-md max-md:rounded-[18px]"
              style={{
                borderTop: `5px solid ${stepAccent(step)}`,
                animationDelay: `${index * 70}ms`,
              }}
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-5 sm:p-6 md:p-7">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white sm:h-[4.5rem] sm:w-[4.5rem] sm:text-4xl"
                  style={{ backgroundColor: stepNumberBg(step) }}
                  aria-hidden
                >
                  {step.number}
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white"
                      style={{ color: stepAccent(step) }}
                      aria-hidden
                    >
                      <Icon className="h-6 w-6" strokeWidth={1.85} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold sm:text-2xl md:text-3xl" style={{ color: NAVY }}>
                        {step.title}
                      </h2>
                      <p className="mt-1 text-base font-medium text-[#475569] sm:text-lg">
                        {step.plain}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 text-base leading-relaxed text-[#0f172a] sm:text-lg">
                    {step.details.map((line) => (
                      <li key={line} className="flex gap-3">
                        <span
                          aria-hidden
                          className="mt-2.5 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: stepNumberBg(step) }}
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>

                  {"pizzaNote" in step && step.pizzaNote ? (
                    <p
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold sm:text-base"
                      style={{ backgroundColor: "rgba(13,122,59,0.08)", color: GREEN }}
                    >
                      <Pizza className="h-5 w-5 shrink-0" aria-hidden />
                      Pizza Day slices are {formatCurrency(1)} each when Pizza Day is on the menu.
                    </p>
                  ) : null}

                  {"help" in step && step.help ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {SUPPORT_CONTACTS.map((contact) => (
                        <a
                          key={contact.email}
                          href={getSupportMailto(contact.email)}
                          className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#041B52] focus-visible:ring-offset-2"
                          style={{ backgroundColor: GREEN }}
                        >
                          Email {contact.name}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <ParentDashboardPreviews />

      <section
        id="safety"
        className="mt-10 w-full scroll-mt-6 text-left sm:mt-12"
        aria-labelledby="safety-heading"
      >
        <div
          className="overflow-hidden rounded-2xl border border-white/40 bg-white/94 shadow-[0_8px_28px_rgba(4,27,82,0.14)] backdrop-blur-md max-md:rounded-[18px]"
          style={{ borderTop: `5px solid ${GREEN}` }}
        >
          <div className="space-y-5 p-5 sm:p-6 md:p-8">
            <div className="flex flex-wrap items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                style={{ backgroundColor: GREEN }}
                aria-hidden
              >
                <Lock className="h-6 w-6" strokeWidth={1.85} />
              </span>
              <div className="min-w-0">
                <h2
                  id="safety-heading"
                  className="text-2xl font-bold sm:text-3xl md:text-4xl"
                  style={{ color: NAVY }}
                >
                  Your questions about safety
                </h2>
                <p className="mt-2 text-base font-medium text-[#475569] sm:text-lg">
                  Short answers about cards, privacy, and who can see your family&apos;s information.
                </p>
              </div>
            </div>

            <dl className="space-y-4">
              {SAFETY_FAQS.map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl border border-[#041B52]/10 bg-[#F8FAFC] px-4 py-4 sm:px-5 sm:py-5"
                >
                  <dt className="text-lg font-bold sm:text-xl" style={{ color: NAVY }}>
                    {item.q}
                  </dt>
                  <dd className="mt-2 text-base leading-relaxed text-[#0f172a] sm:text-lg">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {SUPPORT_CONTACTS.map((contact) => (
                <a
                  key={contact.email}
                  href={getSupportMailto(contact.email)}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#041B52] focus-visible:ring-offset-2"
                  style={{ backgroundColor: GREEN }}
                >
                  Email {contact.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/access/parent"
          className="inline-flex min-h-14 w-full max-w-sm items-center justify-center rounded-2xl px-6 text-lg font-bold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#041B52] focus-visible:ring-offset-2 sm:w-auto sm:min-w-[240px]"
          style={{ backgroundColor: PARENT_ACCENT }}
        >
          Go to Parent Access
        </Link>
        <Link
          href="/login/parent"
          className="inline-flex min-h-14 w-full max-w-sm items-center justify-center rounded-2xl border-2 bg-white/90 px-6 text-lg font-bold transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#041B52] focus-visible:ring-offset-2 sm:w-auto sm:min-w-[200px]"
          style={{ color: NAVY, borderColor: NAVY }}
        >
          I already have an account
        </Link>
      </div>
    </LandingShell>
  )
}