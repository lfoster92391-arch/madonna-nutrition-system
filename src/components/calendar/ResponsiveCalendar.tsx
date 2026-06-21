"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid"
import { CalendarWeekOutlook } from "@/components/calendar/CalendarWeekOutlook"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  addDays,
  formatDateKey,
  formatMonthYear,
  formatWeekRange,
  getWeekStart,
  isSameWeek,
  parseDateKey,
} from "@/lib/calendar"
import type { CalendarEvent, MealTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"

type MobileCalendarLayout = "week" | "month"

interface ResponsiveCalendarProps {
  year: number
  month: number
  onYearMonthChange: (year: number, month: number) => void
  events: CalendarEvent[]
  accentHex: string
  selectedDate: string | null
  onDayClick: (dateKey: string) => void
  readOnly?: boolean
  mealTemplatesById?: Map<string, MealTemplate>
  /** Show Week | Month toggle on mobile (default true) */
  showMobileLayoutToggle?: boolean
  className?: string
}

export function ResponsiveCalendar({
  year,
  month,
  onYearMonthChange,
  events,
  accentHex,
  selectedDate,
  onDayClick,
  readOnly = false,
  mealTemplatesById,
  showMobileLayoutToggle = true,
  className,
}: ResponsiveCalendarProps) {
  const anchorDate = selectedDate ? parseDateKey(selectedDate) : new Date(year, month, 1)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(anchorDate))
  const [mobileLayout, setMobileLayout] = useState<MobileCalendarLayout>("week")

  useEffect(() => {
    if (!selectedDate) return
    const selected = parseDateKey(selectedDate)
    if (!isSameWeek(selected, weekStart)) {
      setWeekStart(getWeekStart(selected))
    }
  }, [selectedDate, weekStart])

  function syncYearMonthFromDate(date: Date) {
    if (date.getFullYear() !== year || date.getMonth() !== month) {
      onYearMonthChange(date.getFullYear(), date.getMonth())
    }
  }

  function prevWeek() {
    const next = addDays(weekStart, -7)
    setWeekStart(next)
    syncYearMonthFromDate(next)
  }

  function nextWeek() {
    const next = addDays(weekStart, 7)
    setWeekStart(next)
    syncYearMonthFromDate(next)
  }

  function prevMonth() {
    if (month === 0) {
      onYearMonthChange(year - 1, 11)
    } else {
      onYearMonthChange(year, month - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      onYearMonthChange(year + 1, 0)
    } else {
      onYearMonthChange(year, month + 1)
    }
  }

  function handleDayClick(dateKey: string) {
    onDayClick(dateKey)
    setWeekStart(getWeekStart(parseDateKey(dateKey)))
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mobile navigation + layout toggle */}
      <div className="md:hidden">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-primary">
            {mobileLayout === "week" ? formatWeekRange(weekStart) : formatMonthYear(year, month)}
          </h3>
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={mobileLayout === "week" ? prevWeek : prevMonth}
              aria-label={mobileLayout === "week" ? "Previous week" : "Previous month"}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const today = new Date()
                onDayClick(formatDateKey(today))
                setWeekStart(getWeekStart(today))
                onYearMonthChange(today.getFullYear(), today.getMonth())
              }}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={mobileLayout === "week" ? nextWeek : nextMonth}
              aria-label={mobileLayout === "week" ? "Next week" : "Next month"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showMobileLayoutToggle ? (
          <Tabs
            value={mobileLayout}
            onValueChange={(value) => setMobileLayout(value as MobileCalendarLayout)}
            className="mb-3"
          >
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : null}

        {mobileLayout === "week" ? (
          <CalendarWeekOutlook
            weekStart={weekStart}
            events={events}
            accentHex={accentHex}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
            readOnly={readOnly}
            mealTemplatesById={mealTemplatesById}
          />
        ) : (
          <CalendarMonthGrid
            year={year}
            month={month}
            events={events}
            accentHex={accentHex}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
            readOnly={readOnly}
            mealTemplatesById={mealTemplatesById}
            mobileLayout="dots"
          />
        )}
      </div>

      {/* Desktop month grid */}
      <div className="hidden md:block">
        <CalendarMonthGrid
          year={year}
          month={month}
          events={events}
          accentHex={accentHex}
          selectedDate={selectedDate}
          onDayClick={handleDayClick}
          readOnly={readOnly}
          mealTemplatesById={mealTemplatesById}
          mobileLayout="hidden"
        />
      </div>
    </div>
  )
}
