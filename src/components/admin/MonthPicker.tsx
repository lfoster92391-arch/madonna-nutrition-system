"use client"

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/input"
import {
  currentMonthParam,
  formatMonthLabel,
  monthSelectOptions,
  shiftMonthParam,
} from "@/lib/dates/month-range"
import { cn } from "@/lib/utils"

type MonthPickerProps = {
  value: string
  onChange: (monthParam: string) => void
  className?: string
  /** When true, prev/next cannot go past the current calendar month. */
  maxMonth?: string
}

export function MonthPicker({ value, onChange, className, maxMonth }: MonthPickerProps) {
  const max = maxMonth ?? currentMonthParam()
  const options = monthSelectOptions(24)
  const atMax = value >= max
  const canGoPrev = true

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-silver/50 bg-silver/5 px-3 py-2 sm:gap-3 sm:px-4",
        className
      )}
    >
      <CalendarDays className="hidden h-4 w-4 shrink-0 text-primary sm:block" aria-hidden />
      <span className="text-sm font-medium text-primary">View month</span>
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Previous month"
          disabled={!canGoPrev}
          onClick={() => onChange(shiftMonthParam(value, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Select
          aria-label="Select month"
          className="min-w-0 flex-1 text-sm font-semibold"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.value > max}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Next month"
          disabled={atMax}
          onClick={() => {
            const next = shiftMonthParam(value, 1)
            if (next <= max) onChange(next)
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <span className="w-full text-xs text-silver-foreground sm:w-auto">
        Showing {formatMonthLabel(value)}
        {value === currentMonthParam() ? " (current)" : ""}
      </span>
    </div>
  )
}
