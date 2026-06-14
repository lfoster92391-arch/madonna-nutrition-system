import Link from "next/link"

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <header className="border-b border-silver/40 bg-white px-6 py-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-base font-semibold text-primary hover:underline"
        >
          ← Back to Home
        </Link>
      </header>
      {children}
    </div>
  )
}
