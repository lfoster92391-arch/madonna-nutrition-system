import type { AgreementContent } from "@/config/agreement-defaults"
import { formatCurrency } from "@/lib/utils"

interface AgreementPreviewProps {
  content: AgreementContent
  versionLabel?: string
  showSignatureBlock?: boolean
}

export function AgreementPreview({
  content,
  versionLabel,
  showSignatureBlock = false,
}: AgreementPreviewProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#041B52]">Fuel The Dons</p>
        <h2 className="mt-1 text-2xl font-bold text-[#041B52]">Cafeteria Agreement</h2>
        <p className="mt-1 text-sm text-[#AEB6C2]">
          Digital acknowledgment required before lunch enrollment
          {versionLabel ? ` · ${versionLabel}` : ""}
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-[#041B52]">Section 1 — Lunch Reservation Requirement</h3>
        <div className="whitespace-pre-wrap rounded-2xl border border-[#AEB6C2]/60 bg-[#F7F8FB] p-6 text-sm leading-relaxed text-[#041B52]">
          {content.mealSignUpPolicy}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-[#041B52]">Section 2 — Pricing</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Main Meal", value: content.pricing.mainMeal },
            { label: "Premium Sides", value: content.pricing.premiumSides },
            { label: "Light Meal", value: content.pricing.lightMeal },
            { label: "Drinks", value: content.pricing.drinks },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#AEB6C2]/60 px-5 py-4"
            >
              <p className="text-sm text-[#AEB6C2]">{item.label}</p>
              <p className="text-xl font-bold text-[#041B52]">{formatCurrency(item.value)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-[#041B52]">Section 3 — Responsibilities</h3>
        <div className="whitespace-pre-wrap rounded-2xl border border-[#AEB6C2]/60 bg-white p-6 text-sm leading-relaxed text-[#041B52]">
          {content.responsibilities}
        </div>
      </section>

      {showSignatureBlock ? (
        <section className="rounded-2xl border border-dashed border-[#041B52]/30 p-6 text-sm text-[#AEB6C2]">
          Section 4 — Digital Signature block appears on the parent signing page.
        </section>
      ) : null}
    </div>
  )
}
