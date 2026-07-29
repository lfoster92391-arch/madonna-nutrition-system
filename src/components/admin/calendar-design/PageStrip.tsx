"use client"

import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { getThemeById } from "@/data/calendar-themes"
import type { DesignPage } from "@/lib/calendar-design/types"

interface PageStripProps {
  pages: DesignPage[]
  activePageId: string
  onSelectPage: (pageId: string) => void
  onAddPage: () => void
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function PageStrip({ pages, activePageId, onSelectPage, onAddPage }: PageStripProps) {
  return (
    <footer className="flex shrink-0 items-center gap-2 border-t border-silver bg-primary px-2 py-2 sm:gap-3 sm:px-4 sm:py-3">
      <span className="hidden text-[10px] font-bold uppercase tracking-wider text-white/50 sm:inline">
        Pages
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
        {pages.map((page) => {
          const theme = getThemeById(page.themeId)
          const active = page.id === activePageId
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page.id)}
              className={cn(
                "flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 p-1.5 transition sm:p-2",
                active
                  ? "border-white bg-white/15 ring-2 ring-white/40"
                  : "border-white/20 hover:border-white/40 hover:bg-white/10"
              )}
            >
              <div
                className="flex h-10 w-14 items-center justify-center rounded-lg text-base font-bold sm:h-14 sm:w-20 sm:text-lg"
                style={{
                  background: theme.colors.headerBg,
                  color: theme.colors.headerText,
                }}
              >
                {theme.emoji}
              </div>
              <span className="text-[9px] font-semibold text-white sm:text-[10px]">
                {MONTH_ABBR[page.month - 1]} {String(page.year).slice(2)}
              </span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onAddPage}
          className="flex h-[3.75rem] w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-white/30 text-white/70 transition hover:border-white/50 hover:bg-white/10 hover:text-white sm:h-[4.75rem] sm:w-20 sm:gap-1"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[9px] font-semibold sm:text-[10px]">Add</span>
        </button>
      </div>
    </footer>
  )
}
