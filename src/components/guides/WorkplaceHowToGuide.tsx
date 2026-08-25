"use client"

import {
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  LogIn,
  Search,
  UtensilsCrossed,
} from "lucide-react"
import { HowToGuide, type HowToGuideSection } from "@/components/guides/HowToGuide"

export type WorkplaceGuidePortal = "teacher" | "staff"

type WorkplaceHowToGuideProps = {
  portal: WorkplaceGuidePortal
  accentColor: string
}

function sectionsFor(portal: WorkplaceGuidePortal): HowToGuideSection[] {
  const otherLabel = portal === "teacher" ? "Teacher" : "Staff"
  const switchLabel = portal === "teacher" ? "Parent | Teacher" : "Parent | Staff"
  const signupPath =
    portal === "teacher" ? "/teacher/sign-up-student" : "/staff/sign-up-student"
  const calendarPath = portal === "teacher" ? "/teacher/calendar" : "/staff/calendar"
  const teacherOnly =
    portal === "teacher"
      ? [
          "Teachers can also use Student Lookup and Meal Roster for classroom lunch lists. Staff see their own cafeteria balance under My Account.",
        ]
      : [
          "Staff can check their own cafeteria balance under My Account. Teachers also have Student Lookup and Meal Roster for classroom lists.",
        ]

  return [
    {
      id: "signin",
      icon: LogIn,
      title: "1. Sign in with your school email",
      body: [
        `Open ${otherLabel} Access on Fuel The Dons and sign in with your Madonna school email (for example @weirtonmadonna.org).`,
        "New to the portal? Create an account with an approved school email, then sign in.",
        "Use the same school login every day — do not share passwords.",
      ],
    },
    {
      id: "dual-role",
      icon: ArrowLeftRight,
      title: "2. Parent and workplace switch (if you have kids)",
      body: [
        `If your school login is also linked as a parent, use the ${switchLabel} switch in the top bar to move between portals.`,
        "Workplace portal: order your own staff lunch and sign students up for lunch.",
        "Parent portal: order for your own children, see balances, photos, and family meal selections.",
        "Link a child under Settings → Your children (or Add a child) if the switch is not available yet.",
      ],
    },
    {
      id: "staff-lunch",
      icon: UtensilsCrossed,
      title: "3. Order your own staff lunch",
      body: [
        "On your dashboard, find My lunch / today’s lunch card.",
        "Confirm today’s published staff lunch when you want it. Regular lunch is $7.00 (Pizza Day is $1.00 per slice).",
        "You can change or cancel today’s reservation from the same card when the menu allows.",
      ],
    },
    {
      id: "signup",
      icon: Search,
      title: "4. Sign up a student for lunch",
      body: [
        `Open Sign up a student (dashboard, Quick Access, or sidebar) — path: ${signupPath}.`,
        "Search by MD ID or student name, then select the student.",
        "Choose published menu days and meal items (main, side, or milk). On Pizza Day, choose how many slices.",
        "Save the signup. It counts for kitchen prep and helps clear the kiosk “no lunch signup” warning.",
        "You can sign up any active student — not only children linked to your parent account.",
      ],
    },
    {
      id: "menu",
      icon: CalendarDays,
      title: "5. View lunch menu / calendar",
      body: [
        `Open Lunch Calendar (${calendarPath}) to see published cafeteria menus.`,
        "Parents and students can only order on days the cafeteria has published. If no dates appear, the menu is not posted yet.",
        "Kitchen TV boards and full kitchen tools are for cafeteria / admin access — use your calendar and announcements for day-to-day menu info.",
        ...teacherOnly,
      ],
    },
    {
      id: "features",
      icon: BookOpen,
      title: "6. What this portal can do",
      body: [
        "Order your own staff lunch for today.",
        "Sign any student up for published lunch days.",
        "Read cafeteria announcements and messages.",
        "If you are also a parent: switch to Parent to manage your children’s orders, balances, and photos.",
        "Get help from Mrs. Morris or Mrs. Dalfol only.",
      ],
    },
  ]
}

export function WorkplaceHowToGuide({ portal, accentColor }: WorkplaceHowToGuideProps) {
  const label = portal === "teacher" ? "Teacher" : "Staff"
  const home = `/${portal}`
  const signup = `/${portal}/sign-up-student`
  const help = `/${portal}/help`
  const calendar = `/${portal}/calendar`

  return (
    <HowToGuide
      title="Teacher & Staff how-to guide"
      description={`Plain steps for Madonna ${label.toLowerCase()}s and coworkers: sign in, switch portals if you have kids, order your own lunch, and sign students up for Fuel The Dons.`}
      accentColor={accentColor}
      pagePadClassName="px-4 py-6 sm:px-6"
      sections={sectionsFor(portal)}
      helpHref={help}
      helpLinkLabel="Open Help"
      ctas={[
        { href: signup, label: "Sign up a student", primary: true },
        { href: home, label: "Back to dashboard" },
        { href: calendar, label: "Lunch calendar" },
      ]}
    />
  )
}
