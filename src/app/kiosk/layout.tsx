import { MustChangePasswordGate } from "@/components/auth/MustChangePasswordGate"

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <MustChangePasswordGate>
      <div className="scan-station-v2 h-[100dvh] min-h-0 overflow-x-hidden bg-white">
        {children}
      </div>
    </MustChangePasswordGate>
  )
}
