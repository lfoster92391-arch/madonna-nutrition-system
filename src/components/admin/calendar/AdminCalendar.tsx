"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe,
  Pencil,
  Plus,
  Save,
  Send,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { CategoryLegend } from "@/components/calendar/CalendarMonthGrid"
import { ResponsiveCalendar } from "@/components/calendar/ResponsiveCalendar"
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
  isSchoolLunchDateKey,
  isWeekendDateKey,
  WEEKEND_MENU_DAY_MESSAGE,
} from "@/lib/calendar"
import type { CalendarEvent, CalendarEventCategory, CalendarPublishStatus } from "@/lib/types"
import type { MealTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getMealCoverPhoto } from "@/lib/meal-templates"
import { publishStatusBadgeClass, publishStatusLabel } from "@/lib/calendar-publish"

const CATEGORIES = Object.keys(EVENT_CATEGORIES) as CalendarEventCategory[]

interface EventFormState {
  title: string
  date: string
  description: string
  category: CalendarEventCategory
  color: string
  mealTemplateId?: string
  publishToCalendar: boolean
}

const emptyForm = (date: string): EventFormState => ({
  title: "",
  date,
  description: "",
  category: "menu_day",
  color: "",
  mealTemplateId: undefined,
  publishToCalendar: true,
})

export function AdminCalendar() {
  const {
    calendarEvents,
    calendarSettings,
    mealTemplates,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    publishCalendarEvents,
    updateMealTemplate,
  } = useDemo()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(now))
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [actionEvent, setActionEvent] = useState<CalendarEvent | null>(null)
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm, setEventForm] = useState<EventFormState>(emptyForm(formatDateKey(now)))
  const [savedFlash, setSavedFlash] = useState(false)
  const [publishFlash, setPublishFlash] = useState<string | null>(null)
  const [showMealPicker, setShowMealPicker] = useState(false)
  const [showCookbookPicker, setShowCookbookPicker] = useState(false)
  const dayScheduleRef = useRef<HTMLDivElement>(null)
  const eventFormRef = useRef<HTMLDivElement>(null)

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
    setActionEvent(null)
    setFocusedEventId(null)
    setShowEventForm(false)
  }

  /** Clicking a menu/event chip on the calendar grid — show Edit + Delete immediately */
  function handleEventClick(event: CalendarEvent) {
    setSelectedDate(event.date)
    setFocusedEventId(event.id)
    setActionEvent(event)
    setShowEventForm(false)
    setEditingEvent(null)
    setEventForm(emptyForm(event.date))
  }

  function startAddEvent() {
    if (!selectedDate) return
    setEditingEvent(null)
    setActionEvent(null)
    setFocusedEventId(null)
    setEventForm(emptyForm(selectedDate))
    setShowEventForm(true)
  }

  function flashPublish(message: string) {
    setPublishFlash(message)
    setTimeout(() => setPublishFlash(null), 3000)
  }

  function startEditEvent(event: CalendarEvent) {
    setEditingEvent(event)
    setFocusedEventId(event.id)
    setActionEvent(null)
    setSelectedDate(event.date)
    setEventForm({
      title: event.title,
      date: event.date,
      description: event.description ?? "",
      category: event.category,
      color: event.color ?? "",
      mealTemplateId: event.mealTemplateId,
      publishToCalendar: event.publishStatus === "published",
    })
    setShowEventForm(true)
  }

  useEffect(() => {
    if (!showEventForm) return
    eventFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [showEventForm, editingEvent?.id])

  useEffect(() => {
    if (!focusedEventId || actionEvent) return
    dayScheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [focusedEventId, actionEvent])

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

  async function quickAddFromCookbook(template: MealTemplate, publish = true) {
    if (!selectedDate) return
    if (!isSchoolLunchDateKey(selectedDate)) {
      flashPublish(WEEKEND_MENU_DAY_MESSAGE)
      return
    }
    const itemsList = template.items.map((i) => i.name).join(", ")
    await addCalendarEvent({
      title: template.name,
      date: selectedDate,
      description: template.description ?? itemsList,
      category: "menu_day",
      mealTemplateId: template.id,
      publishStatus: publish ? "published" : "draft",
      publishedAt: publish ? new Date().toISOString() : undefined,
    })
    await updateMealTemplate(template.id, {
      lastUsedAt: new Date().toISOString(),
    })
    setShowCookbookPicker(false)
    flashSaved()
  }

  async function handleSaveEvent() {
    if (!eventForm.title.trim() || !eventForm.date) return
    if (eventForm.category === "menu_day" && !isSchoolLunchDateKey(eventForm.date)) {
      flashPublish(WEEKEND_MENU_DAY_MESSAGE)
      return
    }
    const publishStatus: CalendarPublishStatus = eventForm.publishToCalendar ? "published" : "draft"
    const payload = {
      title: eventForm.title.trim(),
      date: eventForm.date,
      description: eventForm.description.trim() || undefined,
      category: eventForm.category,
      color: eventForm.color.trim() || undefined,
      mealTemplateId: eventForm.mealTemplateId,
      publishStatus,
      publishedAt: publishStatus === "published" ? new Date().toISOString() : undefined,
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
    setActionEvent(null)
    flashSaved()
  }

  async function handlePublishEvent(id: string) {
    await updateCalendarEvent(id, {
      publishStatus: "published",
      publishedAt: new Date().toISOString(),
    })
    flashPublish("Event published to parent & staff calendars")
    flashSaved()
  }

  async function handlePublishDay() {
    if (!selectedDate) return
    const { count } = await publishCalendarEvents({
      date: selectedDate,
      publishStatus: "published",
    })
    flashPublish(`${count} event${count === 1 ? "" : "s"} published for this day`)
    flashSaved()
  }

  async function handlePublishMonth() {
    const { count } = await publishCalendarEvents({
      month: month + 1,
      year,
      publishStatus: "published",
    })
    flashPublish(`${count} event${count === 1 ? "" : "s"} published for ${formatMonthYear(year, month)}`)
    flashSaved()
  }

  async function handleDeleteEvent(id: string) {
    const event = calendarEvents.find((e) => e.id === id)
    const label = event?.title?.trim() || "this event"
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return
    await deleteCalendarEvent(id)
    setShowEventForm(false)
    setEditingEvent(null)
    setActionEvent(null)
    setFocusedEventId(null)
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
              Schedule meals, publish to parent &amp; staff calendars, and manage operational events
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {savedFlash && (
              <span className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                <Save className="h-4 w-4" />
                Saved
              </span>
            )}
            {publishFlash && (
              <span className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                <Globe className="h-4 w-4" />
                {publishFlash}
              </span>
            )}
            <Button variant="outline" onClick={handlePublishMonth}>
              <Send className="h-4 w-4" />
              Publish Month
            </Button>
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
            <div className="mb-4 hidden flex-wrap items-center justify-between gap-3 md:flex">
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
            <ResponsiveCalendar
              year={year}
              month={month}
              onYearMonthChange={(y, m) => {
                setYear(y)
                setMonth(m)
              }}
              events={calendarEvents}
              accentHex={accentHex}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
              selectedEventId={focusedEventId}
              mealTemplatesById={mealTemplatesById}
            />
            <div className="mt-4">
              <CategoryLegend categories={ADMIN_LEGEND_CATEGORIES} />
            </div>
          </div>
        </Card>

        {selectedDate && (
          <div ref={dayScheduleRef}>
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
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={isWeekendDateKey(selectedDate)}
                  title={
                    isWeekendDateKey(selectedDate) ? WEEKEND_MENU_DAY_MESSAGE : undefined
                  }
                  onClick={() => setShowCookbookPicker(true)}
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  Add from Cookbook
                </Button>
                {selectedEvents.length > 0 && (
                  <Button size="sm" variant="outline" className="shrink-0" onClick={handlePublishDay}>
                    <Globe className="h-4 w-4" />
                    Publish Day
                  </Button>
                )}
                <Button size="sm" className="shrink-0" onClick={startAddEvent}>
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </div>
            </div>
            {isWeekendDateKey(selectedDate) && (
              <p className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-primary">
                {WEEKEND_MENU_DAY_MESSAGE} You can still add holidays or no-school notes.
              </p>
            )}
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
                  const isFocused = focusedEventId === event.id
                  return (
                    <div
                      key={event.id}
                      id={`calendar-event-${event.id}`}
                      className={cn(
                        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
                        isFocused
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-silver/40"
                      )}
                    >
                      <div className="flex min-w-0 gap-3">
                        {cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-lg px-2 py-0.5 text-xs font-bold uppercase"
                              style={{ backgroundColor: `${color}20`, color }}
                            >
                              {cat.label}
                            </span>
                            <span
                              className={cn(
                                "rounded-lg px-2 py-0.5 text-xs font-semibold",
                                publishStatusBadgeClass(event.publishStatus)
                              )}
                            >
                              {publishStatusLabel(event.publishStatus)}
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
                      <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                        {event.publishStatus !== "published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-10 flex-1 sm:flex-none"
                            onClick={() => handlePublishEvent(event.id)}
                            aria-label={`Publish ${event.title}`}
                          >
                            <Globe className="h-4 w-4" />
                            Publish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-10 flex-1 sm:flex-none"
                          onClick={() => startEditEvent(event)}
                          aria-label={`Edit ${event.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-10 flex-1 text-danger hover:bg-danger/10 sm:flex-none"
                          onClick={() => handleDeleteEvent(event.id)}
                          aria-label={`Delete ${event.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
          </div>
        )}

        {showEventForm && (
          <div ref={eventFormRef}>
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
                {eventForm.category === "menu_day" && isWeekendDateKey(eventForm.date) && (
                  <p className="mt-1.5 text-sm text-danger">{WEEKEND_MENU_DAY_MESSAGE}</p>
                )}
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
                    {eventForm.mealTemplateId ? "Change Cookbook Meal" : "Add from Cookbook"}
                  </Button>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-silver/60 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={eventForm.publishToCalendar}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, publishToCalendar: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-silver accent-primary"
                  />
                  <div>
                    <p className="font-semibold text-primary">Publish to parent &amp; staff calendars</p>
                    <p className="text-sm text-silver-foreground">
                      When checked, this event appears on public-facing calendars immediately
                    </p>
                  </div>
                </label>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={handleSaveEvent}
                disabled={
                  eventForm.category === "menu_day" && !isSchoolLunchDateKey(eventForm.date)
                }
              >
                {editingEvent ? "Update" : "Schedule"}
                {eventForm.publishToCalendar ? " & Publish" : ""}
              </Button>
              <Button variant="outline" onClick={() => setShowEventForm(false)}>
                Cancel
              </Button>
              {editingEvent && (
                <Button variant="danger" onClick={() => handleDeleteEvent(editingEvent.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </Card>
          </div>
        )}
      </div>

      {actionEvent && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-event-actions-title"
          onClick={() => setActionEvent(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-silver/60 bg-white p-5 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-primary/60">
                  {EVENT_CATEGORIES[actionEvent.category].label}
                </p>
                <h3
                  id="calendar-event-actions-title"
                  className="mt-1 truncate text-lg font-bold text-primary"
                >
                  {actionEvent.title}
                </h3>
                <p className="mt-1 text-sm text-silver-foreground">
                  {new Date(actionEvent.date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                aria-label="Close"
                onClick={() => setActionEvent(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="min-h-12 flex-1"
                onClick={() => startEditEvent(actionEvent)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="danger"
                className="min-h-12 flex-1"
                onClick={() => handleDeleteEvent(actionEvent.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
            <Button
              variant="outline"
              className="mt-3 min-h-11 w-full"
              onClick={() => {
                setActionEvent(null)
                dayScheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
              }}
            >
              View day schedule
            </Button>
          </div>
        </div>
      )}

      {showCookbookPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-silver/60 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-primary">Add from Cookbook</h3>
            <p className="mb-4 text-sm text-silver-foreground">
              {selectedDate
                ? `Click a saved meal to schedule on ${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}. Meals are published to calendars by default.`
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
