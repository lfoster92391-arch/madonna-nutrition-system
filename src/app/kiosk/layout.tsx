import type { Viewport } from "next"
import { MustChangePasswordGate } from "@/components/auth/MustChangePasswordGate"
import { KioskUnlockGate } from "@/components/kiosk/KioskUnlockGate"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <MustChangePasswordGate>
      <KioskUnlockGate>
        <div className="scan-station-v2 scan-station-v2-shell bg-white">
          {children}
        </div>
      </KioskUnlockGate>
    </MustChangePasswordGate>
  )
}
