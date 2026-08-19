import type { Viewport } from "next"
import { MustChangePasswordGate } from "@/components/auth/MustChangePasswordGate"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <MustChangePasswordGate>
      <div className="scan-station-v2 scan-station-v2-shell bg-white">
        {children}
      </div>
    </MustChangePasswordGate>
  )
}
