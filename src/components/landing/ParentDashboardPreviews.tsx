"use client"

import { useEffect, useId, useState, type ReactNode } from "react"
import { CreditCard, LayoutDashboard, UtensilsCrossed, X } from "lucide-react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Dialog, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const NAVY = "#041B52"
const GREEN = "#0D7A3B"
const SILVER = "#C7CCD6"

type Preview = {
  id: string
  caption: string
  icon: typeof LayoutDashboard
  Mockup: () => ReactNode
}

function BrowserChrome({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div
      className="w-full min-w-0 overflow-hidden rounded-xl border bg-white shadow-[0_10px_28px_rgba(4,27,82,0.12)]"
      style={{ borderColor: `${SILVER}99` }}
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
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
          style={{ backgroundColor: NAVY }}
        >
          F
        </span>
        <span className="truncate text-[11px] font-bold sm:text-xs" style={{ color: NAVY }}>
          Fuel The Dons
        </span>
      </div>
      <span className="shrink-0 text-[10px] font-medium text-[#64748B]">Sign out</span>
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

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {[
            { label: "Family Balance", value: "$42.50", color: NAVY },
            { label: "Students", value: "2", color: NAVY },
            { label: "Action Needed", value: "0", color: NAVY },
          ].map((card) => (
            <div
              key={card.label}
              className="min-w-0 rounded-lg border px-1.5 py-2 sm:px-2"
              style={{ borderColor: SILVER }}
            >
              <p className="truncate text-[8px] font-semibold uppercase tracking-wide text-[#64748B] sm:text-[9px]">
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
          <div className="grid gap-2">
            {[
              { name: "Emma Anderson", grade: "10", balance: "$28.00", ok: true },
              { name: "Jake Anderson", grade: "8", balance: "$14.50", ok: true },
            ].map((student) => (
              <div
                key={student.name}
                className="flex min-w-0 items-center gap-2 rounded-lg border p-2 sm:gap-2.5 sm:p-2.5"
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
                  className="shrink-0 text-xs font-bold tabular-nums sm:text-sm"
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
              <div key={field.label} className="min-w-0">
                <p className="text-[10px] font-semibold text-[#64748B]">{field.label}</p>
                <div
                  className="mt-1 truncate rounded-md border bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-medium"
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
              Pizza Day — 2 slices — $2.00
            </div>

            <div
              className="flex h-9 items-center justify-center rounded-lg px-2 text-center text-xs font-bold text-white sm:text-sm"
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
    <BrowserChrome title="/parent — Add Funds">
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
                className="flex h-9 min-w-0 items-center justify-center rounded-lg border text-xs font-bold"
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
            <CreditCard className="h-3.5 w-3.5 shrink-0" />
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
          <CreditCard className="h-3.5 w-3.5 shrink-0" />
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
    Mockup: HomeMockup,
  },
  {
    id: "order-lunch",
    caption: "Order lunch",
    icon: UtensilsCrossed,
    Mockup: OrderLunchMockup,
  },
  {
    id: "add-funds",
    caption: "Pay with card (Stripe — not saved)",
    icon: CreditCard,
    Mockup: AddFundsMockup,
  },
]

function PreviewLightbox({
  preview,
  onClose,
}: {
  preview: Preview
  onClose: () => void
}) {
  const titleId = useId()

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[80] bg-black/88 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={onClose}
        />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[90] flex flex-col outline-none"
          aria-labelledby={titleId}
          onEscapeKeyDown={onClose}
          onInteractOutside={onClose}
        >
          <DialogTitle id={titleId} className="sr-only">
            {preview.caption} — full screen preview
          </DialogTitle>

          <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-[max(env(safe-area-inset-top),1rem)] sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-white sm:text-2xl md:text-3xl">
                {preview.caption}
              </p>
              <p className="mt-1 text-sm font-medium text-white/75 sm:text-base">
                Press Esc to close
              </p>
            </div>
            <DialogPrimitive.Close
              type="button"
              aria-label="Close full screen preview"
              className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <X className="h-6 w-6" strokeWidth={2.25} />
            </DialogPrimitive.Close>
          </div>

          <div
            className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2 sm:px-6"
            onClick={onClose}
          >
            <div
              className={cn(
                "w-full max-w-[min(94vw,42rem)] origin-center",
                "[zoom:1.05] sm:[zoom:1.2] md:[zoom:1.35] lg:[zoom:1.5] xl:[zoom:1.65]"
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="rounded-2xl bg-white p-1 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-2">
                <preview.Mockup />
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

export function ParentDashboardPreviews() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const activePreview = PREVIEWS.find((preview) => preview.id === activeId) ?? null

  return (
    <section
      id="dashboard-preview"
      className="mt-10 w-full min-w-0 scroll-mt-6 text-left sm:mt-12"
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
            <div className="min-w-0 flex-1">
              <h2
                id="dashboard-preview-heading"
                className="text-2xl font-bold sm:text-3xl md:text-4xl"
                style={{ color: NAVY }}
              >
                What your dashboard looks like
              </h2>
              <p className="mt-2 text-base font-medium text-[#475569] sm:text-lg">
                A quick look at the parent portal — kids, lunch orders, and secure card payments.
                Tap a preview for full screen on a TV or projector.
              </p>
            </div>
          </div>

          <ul className="grid w-full min-w-0 grid-cols-1 items-stretch gap-8 md:gap-10 lg:grid-cols-3 lg:gap-8">
            {PREVIEWS.map((preview) => {
              const Icon = preview.icon
              const Mockup = preview.Mockup
              return (
                <li key={preview.id} className="flex h-full min-w-0 flex-col gap-3">
                  <figure className="m-0 flex h-full min-w-0 flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveId(preview.id)}
                      className="group relative flex w-full min-w-0 flex-1 flex-col rounded-xl text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#041B52] focus-visible:ring-offset-2"
                      aria-label={`Open full screen: ${preview.caption}`}
                    >
                      <div
                        className="pointer-events-none w-full min-w-0 flex-1 transition group-hover:opacity-95 group-active:opacity-90"
                        aria-hidden
                      >
                        <Mockup />
                      </div>
                      <span className="mt-2 block text-center text-sm font-semibold text-[#475569] sm:text-base">
                        Click for full screen
                      </span>
                    </button>
                    <figcaption className="flex min-w-0 items-start gap-2.5 px-0.5">
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: NAVY }}
                        aria-hidden
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
                      </span>
                      <span
                        className="min-w-0 text-base font-bold leading-snug sm:text-lg md:text-xl"
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

      {activePreview ? (
        <PreviewLightbox preview={activePreview} onClose={() => setActiveId(null)} />
      ) : null}
    </section>
  )
}
