"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react"
import { CalendarMonthGrid, CategoryLegend } from "@/components/calendar/CalendarMonthGrid"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ACCENT_COLORS,
  EVENT_CATEGORIES,
  formatDateKey,
  formatMonthYear,
  getAccentHex,
  getEventColor,
} from "@/lib/calendar"
import type { CalendarAccentColor, CalendarEvent, CalendarEventCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

const CATEGORIES = Object.keys(EVENT_CATEGORIES) as CalendarEventCategory[]

interface EventFormState {
  title: string
  date: string
  description: string
  category: CalendarEventCategory
  color: string
}

const emptyForm = (date: string): EventFormState => ({
  title: "",
  date,
  description: "",
  category: "menu_day",
  color: "",
})

export function AdminCalendarDesigner() {
  const {
    calendarEvents,
    calendarSettings,
    updateCalendarSettings,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
  } = useDemo()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(now))
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm, setEventForm] = useState<EventFormState>(emptyForm(formatDateKey(now)))
  const [savedFlash, setSavedFlash] = useState(false)

  const accentHex = getAccentHex(calendarSettings.accentColor)

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    return calendarEvents
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [calendarEvents, selectedDate])

  function formatDateKey(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  function flashSaved() {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  function handleDayClick(dateKey: string) {
    setSelectedDate(dateKey)
    setEventForm(emptyForm(dateKey))
    setEditingEvent(null)
    setShowEventForm(false)
  }

  function startAddEvent() {
    if (!selectedDate) return
    setEditingEvent(null)
    setEventForm(emptyForm(selectedDate))
    setShowEventForm(true)
  }

  function startEditEvent(event: CalendarEvent) {
    setEditingEvent(event)
    setEventForm({
      title: event.title,
      date: event.date,
      description: event.description ?? "",
      category: event.category,
      color: event.color ?? "",
    })
    setShowEventForm(true)
  }

  function handleSaveEvent() {
    if (!eventForm.title.trim() || !eventForm.date) return
    const payload = {
      title: eventForm.title.trim(),
      date: eventForm.date,
      description: eventForm.description.trim() || undefined,
      category: eventForm.category,
      color: eventForm.color.trim() || undefined,
    }
    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, payload)
    } else {
      addCalendarEvent(payload)
    }
    setShowEventForm(false)
    setEditingEvent(null)
    flashSaved()
  }

  function handleDeleteEvent(id: string) {
    deleteCalendarEvent(id)
    setShowEventForm(false)
    setEditingEvent(null)
    flashSaved()
  }

  function handleSettingsChange(updates: Partial<typeof calendarSettings>) {
    updateCalendarSettings(updates)
    flashSaved()
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Admin</p>
            <h1 className="text-3xl font-bold text-primary">Calendar Designer</h1>
            <p className="text-silver-foreground">
              Design the lunch calendar parents see in the Parent Portal
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedFlash && (
              <span className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                <Save className="h-4 w-4" />
                Saved
              </span>
            )}
            <Button variant="outline" asChild>
              <Link href="/parent/calendar" target="_blank">
                <ExternalLink className="h-4 w-4" />
                Preview Parent View
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[20px] border-silver/60">
              <div
                className="px-6 py-5 text-white"
                style={{ backgroundColor: accentHex }}
              >
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                  {calendarSettings.schoolName}
                </p>
                <h2 className="mt-1 text-xl font-bold">{calendarSettings.headerTitle}</h2>
                {calendarSettings.bannerMessage && (
                  <p className="mt-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium">
                    {calendarSettings.bannerMessage}
                  </p>
                )}
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-primary">
                    {formatMonthYear(year, month)}
                  </h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={prevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CalendarMonthGrid
                  year={year}
                  month={month}
                  events={calendarEvents}
                  accentHex={accentHex}
                  selectedDate={selectedDate}
                  onDayClick={handleDayClick}
                />
                <div className="mt-4">
                  <CategoryLegend />
                </div>
              </div>
            </Card>

            {selectedDate && (
              <Card className="rounded-[20px] border-silver/60 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <CardHeader className="p-0">
                    <CardTitle>
                      Events on{" "}
                      {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardTitle>
                  </CardHeader>
                  <Button size="sm" onClick={startAddEvent}>
                    <Plus className="h-4 w-4" />
                    Add Event
                  </Button>
                </div>
                {selectedEvents.length === 0 ? (
                  <p className="text-sm text-silver-foreground">
                    No events on this day. Click &quot;Add Event&quot; to create one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map((event) => {
                      const color = getEventColor(event)
                      const cat = EVENT_CATEGORIES[event.category]
                      return (
                        <div
                          key={event.id}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-silver/40 p-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="rounded-lg px-2 py-0.5 text-xs font-bold uppercase"
                                style={{ backgroundColor: `${color}20`, color }}
                              >
                                {cat.label}
                              </span>
                              <p className="font-semibold text-primary">{event.title}</p>
                            </div>
                            {event.description && (
                              <p className="mt-1 text-sm text-silver-foreground">{event.description}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEditEvent(event)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )}

            {showEventForm && (
              <Card className="rounded-[20px] border-primary/20 p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>{editingEvent ? "Edit Event" : "Add Event"}</CardTitle>
                </CardHeader>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>Title</Label>
                    <Input
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      placeholder="e.g. Taco Tuesday"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select
                      value={eventForm.category}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          category: e.target.value as CalendarEventCategory,
                        })
                      }
                      className="flex h-14 w-full rounded-2xl border border-silver/80 bg-white px-4 text-base text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {EVENT_CATEGORIES[cat].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      placeholder="Menu items, dismissal time, or notes for parents"
                    />
                  </div>
                  {eventForm.category === "special_event" && (
                    <div className="md:col-span-2">
                      <Label>Custom Color (optional hex)</Label>
                      <Input
                        value={eventForm.color}
                        onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })}
                        placeholder="#6366F1"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-3">
                  <Button onClick={handleSaveEvent}>
                    {editingEvent ? "Update Event" : "Add Event"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowEventForm(false)}>
                    Cancel
                  </Button>
                  {editingEvent && (
                    <Button variant="danger" onClick={() => handleDeleteEvent(editingEvent.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            <Card className="rounded-[20px] border-silver/60 p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle>Branding &amp; Settings</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div>
                  <Label>School Name</Label>
                  <Input
                    value={calendarSettings.schoolName}
                    onChange={(e) => handleSettingsChange({ schoolName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Header Title</Label>
                  <Input
                    value={calendarSettings.headerTitle}
                    onChange={(e) => handleSettingsChange({ headerTitle: e.target.value })}
                    placeholder="Madonna High School — Lunch Calendar"
                  />
                </div>
                <div>
                  <Label>Banner Message (optional)</Label>
                  <Textarea
                    value={calendarSettings.bannerMessage ?? ""}
                    onChange={(e) =>
                      handleSettingsChange({
                        bannerMessage: e.target.value.trim() || undefined,
                      })
                    }
                    placeholder="e.g. No school Friday — holiday"
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="mt-2 flex gap-3">
                    {(Object.entries(ACCENT_COLORS) as [CalendarAccentColor, typeof ACCENT_COLORS.navy][]).map(
                      ([key, { label, hex }]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSettingsChange({ accentColor: key })}
                          className={cn(
                            "flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-3 transition",
                            calendarSettings.accentColor === key
                              ? "border-primary bg-primary/5"
                              : "border-silver/60 hover:border-primary/30"
                          )}
                        >
                          <span
                            className="h-8 w-8 rounded-full"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-xs font-semibold text-primary">{label}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-[20px] border-silver/60 p-6">
              <CardHeader className="p-0 pb-3">
                <CardTitle>Event Categories</CardTitle>
              </CardHeader>
              <p className="mb-4 text-sm text-silver-foreground">
                Each category has a preset color parents see on the calendar.
              </p>
              <CategoryLegend compact />
            </Card>

            <Card className="rounded-[20px] border-silver/60 bg-silver/10 p-6">
              <p className="text-sm font-medium text-primary">
                Changes save automatically in demo mode. Use Preview to see the parent view.
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
