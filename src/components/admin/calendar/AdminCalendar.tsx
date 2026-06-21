"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Save,
  Trash2,
  UtensilsCrossed,
} from "lucide-react"
import { CalendarMonthGrid, CategoryLegend } from "@/components/calendar/CalendarMonthGrid"
import { CookbookPicker } from "@/components/admin/cookbook/CookbookPicker"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ADMIN_LEGEND_CATEGORIES,
  EVENT_CATEGORIES,
  formatDateKey,
  formatMonthYear,
  getAccentHex,
  getEventColor,
} from "@/lib/calendar"
import type { CalendarEvent, CalendarEventCategory } from "@/lib/types"
import type { MealTemplate } from "@/lib/types"
import { getMealCoverPhoto } from "@/lib/meal-templates"

const CATEGORIES = Object.keys(EVENT_CATEGORIES) as CalendarEventCategory[]

interface EventFormState {
  title: string
  date: string
  description: string
  category: CalendarEventCategory
  color: string
  mealTemplateId?: string
}

const emptyForm = (date: string): EventFormState => ({
  title: "",
  date,
  description: "",
  category: "menu_day",
  color: "",
  mealTemplateId: undefined,
})

export function AdminCalendar() {
  const {
    calendarEvents,
    calendarSettings,
    mealTemplates,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    updateMealTemplate,
  } = useDemo()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(now))
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm, setEventForm] = useState<EventFormState>(emptyForm(formatDateKey(now)))
  const [savedFlash, setSavedFlash] = useState(false)
  const [showMealPicker, setShowMealPicker] = useState(false)
  const [showCookbookPicker, setShowCookbookPicker] = useState(false)

  const accentHex = getAccentHex(calendarSettings.accentColor)

  const mealTemplatesById = useMemo(
    () => new Map(mealTemplates.map((t) => [t.id, t])),
    [mealTemplates]
  )

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    return calendarEvents
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [calendarEvents, selectedDate])

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
      mealTemplateId: event.mealTemplateId,
    })
    setShowEventForm(true)
  }

  function applyMealTemplate(template: MealTemplate) {
    const itemsList = template.items.map((i) => i.name).join(", ")
    setEventForm((prev) => ({
      ...prev,
      title: template.name,
      description: template.description ?? itemsList,
      category: "menu_day",
      mealTemplateId: template.id,
    }))
    setShowMealPicker(false)
    setShowCookbookPicker(false)
  }

  async function quickAddFromCookbook(template: MealTemplate) {
    if (!selectedDate) return
    const itemsList = template.items.map((i) => i.name).join(", ")
    await addCalendarEvent({
      title: template.name,
      date: selectedDate,
      description: template.description ?? itemsList,
      category: "menu_day",
      mealTemplateId: template.id,
    })
    await updateMealTemplate(template.id, {
      lastUsedAt: new Date().toISOString(),
    })
    setShowCookbookPicker(false)
    flashSaved()
  }

  async function handleSaveEvent() {
    if (!eventForm.title.trim() || !eventForm.date) return
    const payload = {
      title: eventForm.title.trim(),
      date: eventForm.date,
      description: eventForm.description.trim() || undefined,
      category: eventForm.category,
      color: eventForm.color.trim() || undefined,
      mealTemplateId: eventForm.mealTemplateId,
    }
    if (editingEvent) {
      await updateCalendarEvent(editingEvent.id, payload)
    } else {
      await addCalendarEvent(payload)
    }
    if (eventForm.mealTemplateId) {
      await updateMealTemplate(eventForm.mealTemplateId, {
        lastUsedAt: new Date().toISOString(),
      })
    }
    setShowEventForm(false)
    setEditingEvent(null)
    flashSaved()
  }

  async function handleDeleteEvent(id: string) {
    await deleteCalendarEvent(id)
    setShowEventForm(false)
    setEditingEvent(null)
    flashSaved()
  }

  return (
    <div className="admin-calendar min-h-screen bg-white p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Operations</p>
            <h1 className="text-3xl font-bold text-primary">Lunch Calendar</h1>
            <p className="text-silver-foreground">
              Schedule meals and operational events — no parent preview from this view
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
              <Link href="/admin/calendar/design">
                <CalendarDays className="h-4 w-4" />
                Design Studio
              </Link>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[20px] border-silver/60">
          <div className="px-6 py-5 text-white" style={{ backgroundColor: accentHex }}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">
              {calendarSettings.schoolName}
            </p>
            <h2 className="mt-1 text-xl font-bold">{calendarSettings.headerTitle}</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-bold text-primary sm:text-lg">{formatMonthYear(year, month)}</h3>
              <div className="flex shrink-0 gap-2">
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
              mealTemplatesById={mealTemplatesById}
            />
            <div className="mt-4">
              <CategoryLegend categories={ADMIN_LEGEND_CATEGORIES} />
            </div>
          </div>
        </Card>

        {selectedDate && (
          <Card className="rounded-[20px] border-silver/60 p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardHeader className="p-0">
                <CardTitle className="text-base sm:text-lg">
                  Schedule for{" "}
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </CardTitle>
              </CardHeader>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:overflow-visible sm:pb-0">
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => setShowCookbookPicker(true)}>
                  <UtensilsCrossed className="h-4 w-4" />
                  Add from Cookbook
                </Button>
                <Button size="sm" className="shrink-0" onClick={startAddEvent}>
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </div>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-silver-foreground">No events scheduled for this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((event) => {
                  const color = getEventColor(event)
                  const cat = EVENT_CATEGORIES[event.category]
                  const template = event.mealTemplateId
                    ? mealTemplatesById.get(event.mealTemplateId)
                    : undefined
                  const cover = template ? getMealCoverPhoto(template.photos) : undefined
                  return (
                    <div
                      key={event.id}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-silver/40 p-4"
                    >
                      <div className="flex gap-3">
                        {cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          />
                        )}
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
                          {template && (
                            <p className="mt-1 text-xs text-silver-foreground">
                              Linked to cookbook template — edits in cookbook update future uses
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEditEvent(event)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteEvent(event.id)}>
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
              <CardTitle>{editingEvent ? "Edit Event" : "Schedule Event"}</CardTitle>
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
                  placeholder="Menu items or operational notes"
                />
              </div>
              {eventForm.category === "menu_day" && (
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCookbookPicker(true)}
                    className="w-full justify-start"
                  >
                    <UtensilsCrossed className="h-4 w-4" />
                    Add from Cookbook
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <Button onClick={handleSaveEvent}>{editingEvent ? "Update" : "Schedule"}</Button>
              <Button variant="outline" onClick={() => setShowEventForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}
      </div>

      {showCookbookPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-silver/60 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-primary">Add from Cookbook</h3>
            <p className="mb-4 text-sm text-silver-foreground">
              {selectedDate
                ? `Click a saved meal to schedule on ${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.`
                : "Select a day on the calendar first."}
            </p>
            <CookbookPicker
              templates={mealTemplates}
              onSelect={showEventForm ? applyMealTemplate : quickAddFromCookbook}
            />
            <Button variant="outline" className="mt-4 w-full" onClick={() => setShowCookbookPicker(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showMealPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-silver/60 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-primary">Assign Meal Template</h3>
            <div className="mt-4 space-y-2">
              {mealTemplates
                .filter((t) => !t.isArchived)
                .map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyMealTemplate(template)}
                    className="flex w-full rounded-2xl border border-silver/60 p-3 text-left transition hover:border-success"
                  >
                    <p className="font-semibold text-primary">{template.name}</p>
                  </button>
                ))}
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={() => setShowMealPicker(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
