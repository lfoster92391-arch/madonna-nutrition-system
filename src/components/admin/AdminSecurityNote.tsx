"use client"

import { ShieldCheck } from "lucide-react"
import {
  ADMIN_BG,
  ADMIN_NAVY,
  ADMIN_SILVER,
  ADMIN_WHITE,
} from "@/components/admin/layout/admin-theme"
import { IT_HELP_DESK_EMAIL, IT_HELP_DESK_LABEL } from "@/config/it-help"
import { CARD_SAFETY_COPY } from "@/lib/security/card-copy"

/** Plain-language security note for cafeteria admins. */
export function AdminSecurityNote() {
  return (
    <section
      className="rounded-2xl border p-4 sm:p-5"
      style={{ borderColor: ADMIN_SILVER, backgroundColor: ADMIN_WHITE }}
      aria-labelledby="admin-security-heading"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: ADMIN_BG }}
        >
          <ShieldCheck className="h-5 w-5" style={{ color: ADMIN_NAVY }} aria-hidden />
        </div>
        <div className="min-w-0 space-y-2">
          <h2
            id="admin-security-heading"
            className="text-lg font-bold"
            style={{ color: ADMIN_NAVY }}
          >
            Security (cards & alerts)
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: ADMIN_SILVER }}>
            Online payments go through <strong style={{ color: ADMIN_NAVY }}>Stripe</strong>.{" "}
            {CARD_SAFETY_COPY}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: ADMIN_SILVER }}>
            You will get email alerts at {IT_HELP_DESK_LABEL} (
            <a
              className="font-semibold underline"
              style={{ color: ADMIN_NAVY }}
              href={`mailto:${IT_HELP_DESK_EMAIL}`}
            >
              {IT_HELP_DESK_EMAIL}
            </a>
            ) for suspicious logins, admin password resets, and Stripe disputes when email is
            configured. No system can promise zero break-ins — we use layered protection and
            notifications so IT can respond quickly.
          </p>
        </div>
      </div>
    </section>
  )
}