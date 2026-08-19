"use client"

const MADONNA_LOGO_SRC = "/branding/madonna-dons-logo.png"

interface BadgeSchoolHeaderProps {
  subtitle: string
}

/**
 * School ID brand block: navy fills the header, with a punch-safe gutter so the
 * hole does not land on the logo. Logo + “Madonna High School” use the full
 * remaining header width.
 */
export function BadgeSchoolHeader({ subtitle }: BadgeSchoolHeaderProps) {
  return (
    <div className="student-badge-brand flex h-[0.72in] w-full shrink-0 flex-col bg-[#0a1e3f] text-white">
      <div className="student-badge-punch-gutter h-[0.25in] w-full shrink-0" aria-hidden />
      <header className="flex h-[0.47in] w-full min-w-0 shrink-0 items-center gap-2 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- print-friendly static brand asset */}
        <img
          src={MADONNA_LOGO_SRC}
          alt=""
          className="h-[0.40in] w-[0.40in] shrink-0 object-contain object-left"
        />
        <div className="min-w-0 flex-1 leading-none">
          <p className="whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.04em]">
            Madonna High School
          </p>
          <p className="mt-1 truncate text-[8px] font-semibold uppercase tracking-[0.12em] opacity-90">
            {subtitle}
          </p>
        </div>
      </header>
    </div>
  )
}
