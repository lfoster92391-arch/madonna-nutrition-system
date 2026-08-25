"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { HelpCircle } from "lucide-react"
import { formatSupportNames, SUPPORT_CONTACTS } from "@/config/support-contacts"

export type HowToGuideSection = {
  id: string
  icon: LucideIcon
  title: string
  body: readonly string[]
}

export type HowToGuideCta = {
  href: string
  label: string
  primary?: boolean
}

type HowToGuideProps = {
  brandLabel?: string
  title: string
  description: string
  accentColor?: string
  cardClassName?: string
  pagePadClassName?: string
  sectionGapClassName?: string
  ctas?: readonly HowToGuideCta[]
  sections: readonly HowToGuideSection[]
  helpHref?: string
  helpLinkLabel?: string
}

const DEFAULT_NAVY = "#041B52"
const DEFAULT_CARD = "rounded-[12px] border border-[#C8CDD7] bg-white shadow-none"
const DEFAULT_PAD = "px-4 py-6 sm:px-6 md:px-8 md:py-8"
const DEFAULT_GAP = "space-y-6 md:space-y-8"

export function HowToGuide({
  brandLabel = "Fuel The Dons",
  title,
  description,
  accentColor = DEFAULT_NAVY,
  cardClassName = DEFAULT_CARD,
  pagePadClassName = DEFAULT_PAD,
  sectionGapClassName = DEFAULT_GAP,
  ctas = [],
  sections,
  helpHref,
  helpLinkLabel = "Open Help & Support",
}: HowToGuideProps) {
  return (
    <div className={`mx-auto w-full max-w-3xl ${pagePadClassName} ${sectionGapClassName}`}>
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
          {brandLabel}
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ color: accentColor }}>
          {title}
        </h1>
        <p className="mt-3 text-base text-[#64748B]">{description}</p>
        {ctas.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {ctas.map((cta) =>
              cta.primary ? (
                <Link
                  key={cta.href + cta.label}
                  href={cta.href}
                  className="rounded-xl bg-[#041B52] px-4 py-2 text-sm font-semibold text-white"
                >
                  {cta.label}
                </Link>
              ) : (
                <Link
                  key={cta.href + cta.label}
                  href={cta.href}
                  className="rounded-xl border border-[#AEB6C2] bg-white px-4 py-2 text-sm font-semibold text-[#041B52]"
                >
                  {cta.label}
                </Link>
              )
            )}
          </div>
        ) : null}
      </header>

      <nav className={`${cardClassName} p-4 md:p-5`}>
        <p className="mb-3 text-sm font-semibold" style={{ color: accentColor }}>
          Jump to a section
        </p>
        <ul className="flex flex-wrap gap-2">
          {sections.map((section) => (
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

      {sections.map((section) => {
        const Icon = section.icon
        return (
          <section key={section.id} id={section.id} className={`${cardClassName} scroll-mt-24 p-6 md:p-8`}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#041B52]/5">
                <Icon className="h-5 w-5" style={{ color: accentColor }} aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-bold" style={{ color: accentColor }}>
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

      <section className={`${cardClassName} p-6 md:p-8`}>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#041B52]/5">
            <HelpCircle className="h-5 w-5" style={{ color: accentColor }} aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold" style={{ color: accentColor }}>
              Need help?
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              Email {formatSupportNames()}. Include your name when you can.
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {SUPPORT_CONTACTS.map((c) => (
                <li key={c.email}>
                  <a className="font-medium underline" style={{ color: accentColor }} href={`mailto:${c.email}`}>
                    {c.name}: {c.email}
                  </a>
                </li>
              ))}
            </ul>
            {helpHref ? (
              <Link
                href={helpHref}
                className="mt-4 inline-flex text-sm font-semibold underline"
                style={{ color: accentColor }}
              >
                {helpLinkLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
