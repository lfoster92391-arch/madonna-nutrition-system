"use client"

const MADONNA_LOGO_SRC = "/branding/madonna-dons-logo.png"

interface BadgeSchoolHeaderProps {
  subtitle: string
}

/**
 * School ID brand block: navy fills the header, with a 0.5in punch-safe gutter
 * so the hole does not clip the logo or school name.
 */
export function BadgeSchoolHeader({ subtitle }: BadgeSchoolHeaderProps) {
  return (
    <div className="student-badge-brand flex h-[1.02in] w-full shrink-0 flex-col bg-[#0a1e3f] text-white">
      <div className="student-badge-punch-gutter h-[0.5in] w-full shrink-0" aria-hidden />
      <header className="flex h-[0.52in] w-full min-w-0 shrink-0 items-center gap-2 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- print-friendly static brand asset */}
        <img
          src={MADONNA_LOGO_SRC}
          alt=""
          className="h-[0.44in] w-[0.44in] shrink-0 object-contain object-left"
        />
        <div className="min-w-0 flex-1 leading-none">
          <p className="whitespace-nowrap text-[14.5px] font-bold uppercase tracking-[0.04em]">
            Madonna High School
          </p>
          <p className="mt-[0.04in] truncate text-[10px] font-semibold uppercase tracking-wide opacity-90">
            {subtitle}
          </p>
        </div>
      </header>
    </div>
  )
}
