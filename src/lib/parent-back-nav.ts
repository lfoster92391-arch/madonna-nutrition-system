export type ParentBackNav = {
  href: string
  label: string
}

/**
 * Sensible Back targets for parent portal subpages.
 * Returns null on the parent dashboard (no back needed).
 */
export function getParentBackNav(pathname: string): ParentBackNav | null {
  const path = pathname.replace(/\/$/, "") || "/"
  if (path === "/parent") return null

  if (path.startsWith("/parent/student-profile")) {
    return { href: "/parent/students", label: "Back to Students" }
  }

  if (path.startsWith("/parent/add-child")) {
    return { href: "/parent#my-students", label: "Back to My Students" }
  }

  if (path.startsWith("/parent/nutrition")) {
    return { href: "/parent/student-profile", label: "Back to Students" }
  }

  if (path.startsWith("/parent/settings")) {
    return { href: "/parent", label: "Back to Dashboard" }
  }

  if (path.startsWith("/parent/help")) {
    return { href: "/parent", label: "Back to Dashboard" }
  }

  if (path.startsWith("/parent/guide")) {
    return { href: "/parent", label: "Back to Dashboard" }
  }

  if (path.startsWith("/parent/orders")) {
    return { href: "/parent/reserve-lunch", label: "Back to Order Lunch" }
  }

  if (path.startsWith("/parent/reserve-lunch")) {
    return { href: "/parent", label: "Back to Dashboard" }
  }

  if (path.startsWith("/parent/agreement")) {
    return { href: "/parent", label: "Back to Dashboard" }
  }

  // payments, calendar, and other /parent/* subpages
  return { href: "/parent", label: "Back" }
}
