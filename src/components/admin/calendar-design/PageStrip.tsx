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
    <footer className="flex shrink-0 items-center gap-3 border-t border-silver bg-primary px-4 py-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Pages</span>
      <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1">
        {pages.map((page) => {
          const theme = getThemeById(page.themeId)
          const active = page.id === activePageId
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page.id)}
              className={cn(
                "flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 p-2 transition",
                active
                  ? "border-white bg-white/15 ring-2 ring-white/40"
                  : "border-white/20 hover:border-white/40 hover:bg-white/10"
              )}
            >
              <div
                className="flex h-14 w-20 items-center justify-center rounded-lg text-lg font-bold"
                style={{
                  background: theme.colors.headerBg,
                  color: theme.colors.headerText,
                }}
              >
                {theme.emoji}
              </div>
              <span className="text-[10px] font-semibold text-white">
                {MONTH_ABBR[page.month - 1]} {page.year}
              </span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onAddPage}
          className="flex h-[4.75rem] w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-white/30 text-white/70 transition hover:border-white/50 hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Add Page</span>
        </button>
      </div>
    </footer>
  )
}
