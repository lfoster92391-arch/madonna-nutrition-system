"use client"

import type { ReactNode } from "react"
import { CreditCard, LayoutDashboard, UtensilsCrossed } from "lucide-react"

const NAVY = "#041B52"
const GREEN = "#0D7A3B"
const SILVER = "#C7CCD6"

type Preview = {
  id: string
  caption: string
  icon: typeof LayoutDashboard
  mockup: ReactNode
}

function BrowserChrome({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div
      className="overflow-hidden rounded-xl border bg-white shadow-[0_10px_28px_rgba(4,27,82,0.12)]"
      style={{ borderColor: `${SILVER}99` }}
      aria-hidden
    >
      <div
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: `${SILVER}80`, backgroundColor: "#F8FAFC" }}
      >
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]" />
        </span>
        <div
          className="min-w-0 flex-1 truncate rounded-md bg-white px-2.5 py-1 text-[10px] font-medium sm:text-xs"
          style={{ color: "#64748B", border: `1px solid ${SILVER}80` }}
        >
          fuelthedons.com{title}
        </div>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  )
}

function MockHeader() {
  return (
    <div
      className="flex h-9 items-center justify-between border-b px-3"
      style={{ borderColor: SILVER }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold text-white"
          style={{ backgroundColor: NAVY }}
        >
          F
        </span>
        <span className="text-[11px] font-bold sm:text-xs" style={{ color: NAVY }}>
          Fuel The Dons
        </span>
      </div>
      <span className="text-[10px] font-medium text-[#64748B]">Sign out</span>
    </div>
  )
}

function HomeMockup() {
  return (
    <BrowserChrome title="/parent">
      <MockHeader />
      <div className="space-y-3 p-3 sm:p-4">
        <div>
          <p className="text-sm font-bold sm:text-base" style={{ color: NAVY }}>
            Welcome back, Sarah
          </p>
          <p className="mt-0.5 text-[11px] text-[#64748B] sm:text-xs">
            Here&apos;s what&apos;s happening with your family today.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Family Balance", value: "$42.50", color: NAVY },
            { label: "Students", value: "2", color: NAVY },
            { label: "Action Needed", value: "0", color: NAVY },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-lg border px-2 py-2"
              style={{ borderColor: SILVER }}
            >
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#64748B]">
                {card.label}
              </p>
              <p
                className="mt-0.5 text-sm font-bold tabular-nums sm:text-base"
                style={{ color: card.color }}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold sm:text-sm" style={{ color: NAVY }}>
            My Students
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { name: "Emma Anderson", grade: "10", balance: "$28.00", ok: true },
              { name: "Jake Anderson", grade: "8", balance: "$14.50", ok: true },
            ].map((student) => (
              <div
                key={student.name}
                className="flex items-center gap-2.5 rounded-lg border p-2.5"
                style={{ borderColor: SILVER }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: NAVY }}
                >
                  {student.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold sm:text-sm" style={{ color: NAVY }}>
                    {student.name}
                  </p>
                  <p className="text-[10px] text-[#64748B]">Grade {student.grade}</p>
                </div>
                <p
                  className="text-xs font-bold tabular-nums sm:text-sm"
                  style={{ color: student.ok ? "#16A34A" : "#EA580C" }}
                >
                  {student.balance}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

function OrderLunchMockup() {
  return (
    <BrowserChrome title="/parent/reserve-lunch">
      <MockHeader />
      <div className="space-y-3 p-3 sm:p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
            Parent Portal
          </p>
          <p className="text-sm font-bold sm:text-base" style={{ color: NAVY }}>
            Order Lunch
          </p>
          <p className="mt-0.5 text-[11px] text-[#64748B] sm:text-xs">
            Order meals from the published school lunch menu.
          </p>
        </div>

        <div className="rounded-[14px] border p-3 sm:p-4" style={{ borderColor: `${SILVER}99` }}>
          <p className="text-xs font-semibold sm:text-sm" style={{ color: NAVY }}>
            New Order
          </p>
          <div className="mt-3 space-y-2.5">
            {[
              { label: "Student", value: "Emma Anderson" },
              { label: "Date (published menu)", value: "Mon, Mar 16 — Pizza Day" },
              { label: "Meal", value: "Main Meal ($1.00 / slice)" },
            ].map((field) => (
              <div key={field.label}>
                <p className="text-[10px] font-semibold text-[#64748B]">{field.label}</p>
                <div
                  className="mt-1 rounded-md border bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-medium"
                  style={{ borderColor: SILVER, color: NAVY }}
                >
                  {field.value}
                </div>
              </div>
            ))}

            <div
              className="rounded-lg px-3 py-2 text-xs font-semibold"
              style={{ backgroundColor: "rgba(13,122,59,0.08)", color: GREEN }}
            >
              Pizza Day 뿯½ 2 slices 뿯½ $2.00
            </div>

            <div
              className="flex h-9 items-center justify-center rounded-lg text-xs font-bold text-white sm:text-sm"
              style={{ backgroundColor: NAVY }}
            >
              Order lunch for Mon, Mar 16
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

function AddFundsMockup() {
  return (
    <BrowserChrome title="/parent 뿯½ Add Funds">
      <MockHeader />
      <div className="space-y-3 p-3 sm:p-4">
        <div>
          <p className="text-sm font-bold sm:text-base" style={{ color: NAVY }}>
            Add Funds
          </p>
          <p className="mt-0.5 text-[11px] text-[#64748B] sm:text-xs">
            Deposit to Emma Anderson&apos;s cafeteria account.
          </p>
        </div>

        <div
          className="rounded-xl border px-3 py-2.5"
          style={{ borderColor: `${SILVER}80`, backgroundColor: "#F8FAFC" }}
        >
          <p className="text-[10px] font-medium text-[#64748B]">Current balance</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums" style={{ color: "#16A34A" }}>
            $28.00
          </p>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold" style={{ color: NAVY }}>
            Amount
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {["$10", "$20", "$25", "$50"].map((amount, i) => (
              <div
                key={amount}
                className="flex h-9 items-center justify-center rounded-lg border text-xs font-bold"
                style={
                  i === 1
                    ? { backgroundColor: NAVY, color: "white", borderColor: NAVY }
                    : { borderColor: SILVER, color: NAVY }
                }
              >
                {amount}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: `${SILVER}99` }}>
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: NAVY }}>
            <CreditCard className="h-3.5 w-3.5" />
            Secure checkout
          </div>
          <p className="mt-1 text-[10px] leading-snug text-[#64748B] sm:text-[11px]">
            Card details are entered each time through Stripe — we never store your card number.
          </p>
        </div>

        <div
          className="flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-bold text-white sm:text-sm"
          style={{ backgroundColor: NAVY }}
        >
          <CreditCard className="h-3.5 w-3.5" />
          Pay $20.00 with card
        </div>
      </div>
    </BrowserChrome>
  )
}

const PREVIEWS: Preview[] = [
  {
    id: "kids-balances",
    caption: "Your kids and balances",
    icon: LayoutDashboard,
    mockup: <HomeMockup />,
  },
  {
    id: "order-lunch",
    caption: "Order lunch",
    icon: UtensilsCrossed,
    mockup: <OrderLunchMockup />,
  },
  {
    id: "add-funds",
    caption: "Pay with card (Stripe — not saved)",
    icon: CreditCard,
    mockup: <AddFundsMockup />,
  },
]

export function ParentDashboardPreviews() {
  return (
    <section
      id="dashboard-preview"
      className="mt-10 w-full scroll-mt-6 text-left sm:mt-12"
      aria-labelledby="dashboard-preview-heading"
    >
      <div
        className="overflow-hidden rounded-2xl border border-white/40 bg-white/94 shadow-[0_8px_28px_rgba(4,27,82,0.14)] backdrop-blur-md max-md:rounded-[18px]"
        style={{ borderTop: `5px solid ${NAVY}` }}
      >
        <div className="space-y-6 p-5 sm:space-y-8 sm:p-6 md:p-8">
          <div className="flex flex-wrap items-start gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: NAVY }}
              aria-hidden
            >
              <LayoutDashboard className="h-6 w-6" strokeWidth={1.85} />
            </span>
            <div className="min-w-0">
              <h2
                id="dashboard-preview-heading"
                className="text-2xl font-bold sm:text-3xl md:text-4xl"
                style={{ color: NAVY }}
              >
                What your dashboard looks like
              </h2>
              <p className="mt-2 text-base font-medium text-[#475569] sm:text-lg">
                A quick look at the parent portal — kids, lunch orders, and secure card payments.
              </p>
            </div>
          </div>

          <ul className="grid gap-8 lg:grid-cols-3 lg:gap-6">
            {PREVIEWS.map((preview) => {
              const Icon = preview.icon
              return (
                <li key={preview.id} className="flex flex-col gap-3">
                  <figure className="m-0 flex flex-col gap-3">
                    {preview.mockup}
                    <figcaption className="flex items-start gap-2.5 px-0.5">
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: NAVY }}
                        aria-hidden
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
                      </span>
                      <span
                        className="text-lg font-bold leading-snug sm:text-xl md:text-2xl"
                        style={{ color: NAVY }}
                      >
                        {preview.caption}
                      </span>
                    </figcaption>
                  </figure>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
