import type { Metadata } from "next"
import { ParentOrientationClient } from "@/components/landing/ParentOrientationClient"

export const metadata: Metadata = {
  title: "Parent Orientation",
  description:
    "Fuel The Dons parent orientation — create an account, link students, add funds, and order lunch in five simple steps.",
  alternates: {
    canonical: "/orientation",
  },
  openGraph: {
    title: "Parent Orientation | Fuel The Dons",
    description:
      "Five simple steps for Madonna families: account, link students, balances, lunch orders, and help.",
    url: "/orientation",
  },
}

/** Public parent orientation guide — no login required. */
export default function ParentOrientationPage() {
  return <ParentOrientationClient />
}