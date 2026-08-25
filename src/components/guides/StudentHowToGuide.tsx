"use client"

import {
  Bell,
  BookOpen,
  ClipboardList,
  LogIn,
  ShieldOff,
  UtensilsCrossed,
} from "lucide-react"
import { HowToGuide, type HowToGuideSection } from "@/components/guides/HowToGuide"

const NAVY = "#041B52"

const SECTIONS: HowToGuideSection[] = [
  {
    id: "signin",
    icon: LogIn,
    title: "1. Sign in with your school email",
    body: [
      "Go to Student Access on Fuel The Dons.",
      "Sign in with your Madonna school email ending in @weirtonmadonna.org.",
      "Your MD ID can work as a backup if your account was set up that way.",
      "This login is only for ordering your own lunch — not for managing family accounts.",
    ],
  },
  {
    id: "order",
    icon: UtensilsCrossed,
    title: "2. Order lunch for yourself",
    body: [
      "From Student home, tap Order lunch.",
      "Pick a date with a published lunch menu, then choose your meal (main, side, or milk). On Pizza Day, choose how many slices.",
      "Tap to save your order. You can only order for yourself — not for friends or siblings.",
      "Regular lunch is $7.00 (Pizza Day is $1.00 per slice).",
    ],
  },
  {
    id: "orders",
    icon: ClipboardList,
    title: "3. See your orders",
    body: [
      "Open My orders from the bottom bar or Student home.",
      "Each saved choice shows the date, meal type, and status.",
      "If no dates appear under Order lunch, the cafeteria has not published that menu yet. Check back later.",
    ],
  },
  {
    id: "cannot",
    icon: ShieldOff,
    title: "4. What you cannot do here",
    body: [
      "You cannot change your lunch badge photo — parents handle photos in the Parent Portal.",
      "You cannot add lunch money online in this portal. Parents bring cash to the office (Mrs. Dalfol) or use Parent Portal payments when available.",
      "You cannot order lunch for other students.",
    ],
  },
  {
    id: "balance",
    icon: Bell,
    title: "5. Balance and low-funds alerts",
    body: [
      "Student home shows your lunch balance as view-only.",
      "If your balance runs low, parents get alerts so they can add money.",
      "Need funds before lunch? Ask a parent or Mrs. Dalfol at the office.",
    ],
  },
  {
    id: "features",
    icon: BookOpen,
    title: "6. Quick reminder",
    body: [
      "Order only your own lunch on published menu days.",
      "Check My orders anytime to confirm what you already chose.",
      "Parents and the office manage photos, deposits, and family settings.",
      "Need help? Contact Mrs. Morris or Mrs. Dalfol.",
    ],
  },
]

export function StudentHowToGuide() {
  return (
    <HowToGuide
      title="Student how-to guide"
      description="Plain steps for Madonna students: sign in with school email, order your own lunch, and see your saved orders."
      accentColor={NAVY}
      pagePadClassName="px-0 py-0"
      sections={SECTIONS}
      ctas={[
        { href: "/student/order", label: "Order lunch", primary: true },
        { href: "/student/orders", label: "My orders" },
        { href: "/student", label: "Student home" },
      ]}
    />
  )
}
