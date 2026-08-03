export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="scan-station-root mx-auto h-[100dvh] w-full max-w-[1920px] overflow-x-hidden overflow-y-hidden bg-white">
      {children}
    </div>
  )
}
