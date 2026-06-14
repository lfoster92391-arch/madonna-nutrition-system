import CafeteriaSidebar from "@/components/CafeteriaSidebar"

export default function CafeteriaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">

      <CafeteriaSidebar />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  )
}