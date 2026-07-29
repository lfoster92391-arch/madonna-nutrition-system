"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { LayoutGrid, SlidersHorizontal } from "lucide-react"
import { DesignToolbar } from "@/components/admin/calendar-design/DesignToolbar"
import { ElementsPanel } from "@/components/admin/calendar-design/ElementsPanel"
import { DesignCanvas } from "@/components/admin/calendar-design/DesignCanvas"
import { PropertiesPanel } from "@/components/admin/calendar-design/PropertiesPanel"
import { PageStrip } from "@/components/admin/calendar-design/PageStrip"
import { ExportDesignModal } from "@/components/admin/calendar-design/ExportDesignModal"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { createDefaultPage } from "@/lib/calendar-design/defaults"
import {
  debounce,
  loadDesignDocument,
  saveDesignDocument,
} from "@/lib/calendar-design/storage"
import { DEFAULT_APPEARANCE } from "@/lib/calendar-design/defaults"
import {
  BASIC_ELEMENT_CATALOG,
  CORE_ELEMENT_TYPES,
  ELEMENT_CATALOG,
} from "@/lib/calendar-design/types"
import { getMealCoverPhoto } from "@/lib/meal-templates"
import type { MealTemplate } from "@/lib/types"
import type {
  CalendarDesignDocument,
  DesignElement,
  DesignElementType,
  ElementAppearance,
  ViewportMode,
} from "@/lib/calendar-design/types"

const MAX_HISTORY = 50
/** Side panels dock inline from xl; below that they open as sheets. */
const COMPACT_LAYOUT_QUERY = "(max-width: 1279px)"

function useIsCompactLayout() {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(COMPACT_LAYOUT_QUERY)
    const sync = () => setIsCompact(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  return isCompact
}

function cloneDoc(doc: CalendarDesignDocument): CalendarDesignDocument {
  return JSON.parse(JSON.stringify(doc)) as CalendarDesignDocument
}

function createElementFromCatalog(type: DesignElementType): DesignElement {
  const catalog =
    BASIC_ELEMENT_CATALOG.find((c) => c.type === type) ??
    ELEMENT_CATALOG.find((c) => c.type === type)
  const id = `el-${type}-${Date.now()}`
  return {
    id,
    type,
    label: catalog?.label ?? type,
    // Flow layout below calendar — these coords are unused for rendering.
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    appearance: {
      ...DEFAULT_APPEARANCE,
      backgroundColor: "#F8FAFF",
      borderColor: "#041B52",
      textColor: "#0A1E3F",
    },
    ...(type === "staff_pick"
      ? {
          staffPick: {
            title: "Staff Pick of the Week",
            subtitle: "This week's favorite from our team",
            mealName: "Featured Meal",
            staffName: "Staff Member",
          },
        }
      : {}),
    ...(type === "did_you_know"
      ? {
          dailyBite: {
            category: "food-facts",
            autoMatchTheme: true,
            rotateDaily: true,
            factIndex: 0,
          },
        }
      : {}),
    ...(type === "announcement"
      ? { content: "Reminder: Please remember your lunch account PIN." }
      : {}),
    ...(type === "text_box" ? { content: "Add a short note for families." } : {}),
    ...(type === "nutrition_box"
      ? { content: "Pair protein with colorful veggies for lasting energy." }
      : {}),
    ...(type === "meal_card"
      ? { content: "Featured lunch item" }
      : {}),
  }
}

export function CalendarDesignStudio() {
  const { mealTemplates, addCalendarEvent, updateMealTemplate, publishCalendarEvents } = useDemo()
  const isCompactLayout = useIsCompactLayout()
  const [doc, setDoc] = useState<CalendarDesignDocument>(() => loadDesignDocument())
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [cookbookDay, setCookbookDay] = useState(1)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [viewport, setViewport] = useState<ViewportMode>("desktop")
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [showLayers, setShowLayers] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [elementsOpen, setElementsOpen] = useState(false)
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [history, setHistory] = useState<CalendarDesignDocument[]>([])
  const [future, setFuture] = useState<CalendarDesignDocument[]>([])
  const initialized = useRef(false)

  const debouncedSave = useMemo(
    () => debounce((next: CalendarDesignDocument) => saveDesignDocument(next), 800),
    []
  )

  const activePage = useMemo(
    () => doc.pages.find((p) => p.id === doc.activePageId) ?? doc.pages[0],
    [doc]
  )

  const selectedElement = useMemo(
    () => activePage?.elements.find((el) => el.id === selectedElementId) ?? null,
    [activePage, selectedElementId]
  )

  const pushHistory = useCallback((prev: CalendarDesignDocument) => {
    setHistory((h) => [...h.slice(-(MAX_HISTORY - 1)), cloneDoc(prev)])
    setFuture([])
  }, [])

  const updateDoc = useCallback(
    (updater: (prev: CalendarDesignDocument) => CalendarDesignDocument) => {
      setDoc((prev) => {
        pushHistory(prev)
        const next = updater(prev)
        debouncedSave(next)
        return next
      })
    },
    [debouncedSave, pushHistory]
  )

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      if (window.matchMedia(COMPACT_LAYOUT_QUERY).matches) {
        setViewport("tablet")
      }
      if (window.matchMedia("(max-width: 639px)").matches) {
        setViewport("mobile")
        setZoom(0.85)
      }
      return
    }
  }, [])

  useEffect(() => {
    if (isCompactLayout) {
      setViewport((current) =>
        current === "desktop" ? "tablet" : current
      )
    }
  }, [isCompactLayout])

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setDoc((current) => {
        setFuture((f) => [cloneDoc(current), ...f])
        debouncedSave(prev)
        return prev
      })
      return h.slice(0, -1)
    })
  }, [debouncedSave])

  const handleRedo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f
      const next = f[0]
      setDoc((current) => {
        setHistory((h) => [...h, cloneDoc(current)])
        debouncedSave(next)
        return next
      })
      return f.slice(1)
    })
  }, [debouncedSave])

  const handleAddElement = useCallback(
    (type: DesignElementType) => {
      // Core page blocks already exist — select them instead of stacking overlays.
      if (CORE_ELEMENT_TYPES.includes(type)) {
        const existing = doc.pages
          .find((p) => p.id === doc.activePageId)
          ?.elements.find((el) => el.type === type)
        if (existing) {
          setSelectedElementId(existing.id)
          if (isCompactLayout) {
            setElementsOpen(false)
            setPropertiesOpen(true)
          }
          return
        }
      }

      const el = createElementFromCatalog(type)
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId ? { ...p, elements: [...p.elements, el] } : p
        ),
      }))
      setSelectedElementId(el.id)
      if (isCompactLayout) {
        setElementsOpen(false)
        setPropertiesOpen(true)
      }
    },
    [doc.activePageId, doc.pages, isCompactLayout, updateDoc]
  )

  const handleRemoveElement = useCallback(
    (id: string) => {
      if (id === "el-calendar-grid" || id === "el-did-you-know" || id === "el-staff-pick") {
        return
      }
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId
            ? { ...p, elements: p.elements.filter((el) => el.id !== id) }
            : p
        ),
      }))
      setSelectedElementId((current) => (current === id ? null : current))
    },
    [updateDoc]
  )

  const handleApplyTheme = useCallback(
    (themeId: string) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId ? { ...p, themeId } : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleUpdateElement = useCallback(
    (id: string, patch: Partial<DesignElement>) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId
            ? {
                ...p,
                elements: p.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
              }
            : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleUpdateAppearance = useCallback(
    (id: string, patch: Partial<ElementAppearance>) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId
            ? {
                ...p,
                elements: p.elements.map((el) =>
                  el.id === id ? { ...el, appearance: { ...el.appearance, ...patch } } : el
                ),
              }
            : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleUpdateStaffPick = useCallback(
    (id: string, patch: Partial<NonNullable<DesignElement["staffPick"]>>) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId
            ? {
                ...p,
                elements: p.elements.map((el) =>
                  el.id === id && el.staffPick
                    ? { ...el, staffPick: { ...el.staffPick, ...patch } }
                    : el
                ),
              }
            : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleUpdateDailyBite = useCallback(
    (id: string, patch: Partial<NonNullable<DesignElement["dailyBite"]>>) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId
            ? {
                ...p,
                elements: p.elements.map((el) =>
                  el.id === id && el.dailyBite
                    ? { ...el, dailyBite: { ...el.dailyBite, ...patch } }
                    : el
                ),
              }
            : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleUpdatePage = useCallback(
    (patch: Partial<typeof activePage>) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId ? { ...p, ...patch } : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleSelectPage = useCallback((pageId: string) => {
    setSelectedElementId(null)
    updateDoc((prev) => ({ ...prev, activePageId: pageId }))
  }, [updateDoc])

  const handleAddFromCookbook = useCallback(
    async (template: MealTemplate, day: number) => {
      const page = doc.pages.find((p) => p.id === doc.activePageId) ?? doc.pages[0]
      if (!page) return

      const cover = getMealCoverPhoto(template.photos)
      const el: DesignElement = {
        id: `el-meal-${Date.now()}`,
        type: "meal_card",
        label: "Meal highlight",
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        appearance: {
          ...DEFAULT_APPEARANCE,
          backgroundColor: "#F8FAFF",
          borderColor: "#041B52",
          textColor: "#0A1E3F",
        },
        mealRef: {
          templateId: template.id,
          name: template.name,
          photoUrl: cover,
          category: template.category,
        },
      }

      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId ? { ...p, elements: [...p.elements, el] } : p
        ),
      }))
      setSelectedElementId(el.id)

      const dateKey = `${page.year}-${String(page.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const itemsList = template.items.map((i) => i.name).join(", ")
      await addCalendarEvent({
        title: template.name,
        date: dateKey,
        description: template.description ?? itemsList,
        category: "menu_day",
        mealTemplateId: template.id,
        publishStatus: "published",
        publishedAt: new Date().toISOString(),
      })
      await updateMealTemplate(template.id, {
        lastUsedAt: new Date().toISOString(),
      })
    },
    [doc.pages, doc.activePageId, updateDoc, addCalendarEvent, updateMealTemplate]
  )

  const handleAddPage = useCallback(() => {
    const last = doc.pages[doc.pages.length - 1]
    let nextMonth = last.month + 1
    let nextYear = last.year
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }
    // Prefer seasonal themes when extending into the next school-year month
    const seasonalTheme =
      nextMonth === 7
        ? "patriotic"
        : nextMonth === 8 || nextMonth === 9
          ? "back-to-school"
          : nextMonth === 10
            ? "halloween"
            : nextMonth === 11
              ? "thanksgiving"
              : nextMonth === 12
                ? "christmas-lunch"
                : nextMonth === 1
                  ? "new-years"
                  : nextMonth === 2
                    ? "valentines-day"
                    : nextMonth === 3
                      ? "st-patricks-day"
                      : nextMonth === 4
                        ? "easter"
                        : nextMonth === 5
                          ? "teacher-appreciation"
                          : nextMonth === 6
                            ? "graduation"
                            : last.themeId
    const newPage = createDefaultPage(nextMonth, nextYear, seasonalTheme)
    updateDoc((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
      activePageId: newPage.id,
    }))
    setSelectedElementId(null)
  }, [doc.pages, updateDoc])

  const handleSave = useCallback(() => {
    saveDesignDocument(doc)
  }, [doc])

  if (!activePage) return null

  const elementsPanelProps = {
    activeThemeId: activePage.themeId,
    onAddElement: handleAddElement,
    onApplyTheme: handleApplyTheme,
    mealTemplates,
    onAddFromCookbook: handleAddFromCookbook,
    cookbookDay,
    onCookbookDayChange: setCookbookDay,
  }

  const propertiesPanelProps = {
    page: activePage,
    selectedElement,
    onUpdateElement: handleUpdateElement,
    onUpdatePage: handleUpdatePage,
    onUpdateAppearance: handleUpdateAppearance,
    onUpdateStaffPick: handleUpdateStaffPick,
    onUpdateDailyBite: handleUpdateDailyBite,
  }

  const handlePublish = useCallback(async () => {
    const page = doc.pages.find((p) => p.id === doc.activePageId) ?? doc.pages[0]
    if (!page) return
    const { count } = await publishCalendarEvents({
      month: page.month,
      year: page.year,
      publishStatus: "published",
    })
    setPublishMessage(`${count} event${count === 1 ? "" : "s"} published for ${page.title}`)
    setTimeout(() => setPublishMessage(null), 3500)
  }, [doc.pages, doc.activePageId, publishCalendarEvents])

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {publishMessage && (
        <div className="shrink-0 bg-success/10 px-4 py-2 text-center text-sm font-semibold text-success">
          {publishMessage}
        </div>
      )}
      <DesignToolbar
        zoom={zoom}
        viewport={viewport}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        showLayers={showLayers}
        compact={isCompactLayout}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))}
        onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
        onViewportChange={setViewport}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onToggleSnap={() => setSnapToGrid((v) => !v)}
        onToggleLayers={() => setShowLayers((v) => !v)}
        onVersionHistory={() => alert("Version history — coming soon!")}
        onExport={() => setExportOpen(true)}
        onSave={handleSave}
        onPreview={() => setViewport("print")}
        onPublish={handlePublish}
      />

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <ElementsPanel {...elementsPanelProps} className="hidden xl:flex" />
        <DesignCanvas
          page={activePage}
          zoom={zoom}
          viewport={viewport}
          showGrid={showGrid}
          selectedElementId={selectedElementId}
          onSelectElement={(id) => {
            setSelectedElementId(id)
            if (id && isCompactLayout) {
              setPropertiesOpen(true)
            }
          }}
          onRemoveElement={handleRemoveElement}
        />
        <PropertiesPanel {...propertiesPanelProps} className="hidden xl:flex" />
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-silver bg-white px-3 py-2 xl:hidden">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 flex-1"
          onClick={() => setElementsOpen(true)}
        >
          <LayoutGrid className="h-4 w-4" />
          Add Elements
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 flex-1"
          onClick={() => setPropertiesOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Properties
        </Button>
      </div>

      <PageStrip
        pages={doc.pages}
        activePageId={doc.activePageId}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
      />

      <Sheet open={elementsOpen} onOpenChange={setElementsOpen}>
        <SheetContent
          side="left"
          className="flex h-full w-full max-w-[min(20rem,92vw)] flex-col gap-0 overflow-hidden p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Add Elements</SheetTitle>
            <SheetDescription>Add calendar widgets, themes, and cookbook meals</SheetDescription>
          </SheetHeader>
          <ElementsPanel {...elementsPanelProps} className="h-full w-full border-0" />
        </SheetContent>
      </Sheet>

      <Sheet open={propertiesOpen} onOpenChange={setPropertiesOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full max-w-[min(22rem,92vw)] flex-col gap-0 overflow-hidden p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Properties</SheetTitle>
            <SheetDescription>Edit the selected calendar element or page settings</SheetDescription>
          </SheetHeader>
          <PropertiesPanel {...propertiesPanelProps} className="h-full w-full border-0" />
        </SheetContent>
      </Sheet>

      <ExportDesignModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  )
}
