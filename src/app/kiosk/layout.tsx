import { MustChangePasswordGate } from "@/components/auth/MustChangePasswordGate"

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <MustChangePasswordGate>
      <div className="scan-station-v2 min-h-screen bg-white">
        {children}
      </div>
    </MustChangePasswordGate>
  )
}
