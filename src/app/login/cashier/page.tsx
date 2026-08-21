import { LoginForm } from "@/components/auth/LoginForm"
import { LandingShell } from "@/components/landing/LandingShell"
import { BRAND } from "@/config/brand"

const NAVY = "#041B52"

export default function CashierLoginPage() {
  return (
    <LandingShell>
      <header className="mb-5 w-full min-w-0 md:mb-7">
        <p
          className="text-base font-bold uppercase tracking-[0.18em] sm:text-lg"
          style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
        >
          {BRAND.productName}
        </p>
        <h1
          className="mt-2 text-2xl font-bold sm:text-3xl"
          style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
        >
          Cashier sign-in
        </h1>
        <p
          className="mx-auto mt-2 max-w-xl text-sm font-medium leading-snug text-gray-600 sm:text-base"
          style={{ textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}
        >
          Sign in to unlock à la carte on the lunch POS, then open the Cashier station.
        </p>
      </header>
      <section
        className="landing-card-enter w-full min-w-0 overflow-hidden rounded-2xl border border-white/35 bg-white/92 p-4 shadow-[0_8px_28px_rgba(4,27,82,0.16)] backdrop-blur-md sm:p-5"
        style={{ borderTop: "4px solid #0D7A3B" }}
      >
        <LoginForm role="cashier" redirectTo="/kiosk" variant="embedded" />
      </section>
    </LandingShell>
  )
}
