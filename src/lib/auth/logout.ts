import type { PortalRole } from "@/components/providers/AuthProvider"

export function portalLoginPath(role: Exclude<PortalRole, null>): string {
  switch (role) {
    case "admin":
      return "/login/admin"
    case "parent":
      return "/login/parent"
    case "teacher":
      return "/login/teacher"
    case "cashier":
      return "/kiosk"
  }
}

/** Clear auth/demo state via AuthProvider.logout, then hard-navigate to the portal login page. */
export function signOutAndRedirect(
  role: Exclude<PortalRole, null>,
  logout: () => void
): void {
  logout()
  window.location.assign(portalLoginPath(role))
}
