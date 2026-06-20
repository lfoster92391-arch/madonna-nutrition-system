"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DesignToolbar } from "@/components/admin/calendar-design/DesignToolbar"
import { ElementsPanel } from "@/components/admin/calendar-design/ElementsPanel"
import { DesignCanvas } from "@/components/admin/calendar-design/DesignCanvas"
import { PropertiesPanel } from "@/components/admin/calendar-design/PropertiesPanel"
import { PageStrip } from "@/components/admin/calendar-design/PageStrip"
import { ExportDesignModal } from "@/components/admin/calendar-design/ExportDesignModal"
import { useDemo } from "@/components/providers/DemoProvider"
import { createDefaultPage } from "@/lib/calendar-design/defaults"
import {
  debounce,
  loadDesignDocument,
  saveDesignDocument,
} from "@/lib/calendar-design/storage"
import { DEFAULT_APPEARANCE } from "@/lib/calendar-design/defaults"
import { ELEMENT_CATALOG } from "@/lib/calendar-design/types"
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

function cloneDoc(doc: CalendarDesignDocument): CalendarDesignDocument {
  return JSON.parse(JSON.stringify(doc)) as CalendarDesignDocument
}

function createElementFromCatalog(type: DesignElementType): DesignElement {
  const catalog = ELEMENT_CATALOG.find((c) => c.type === type)
  const id = `el-${type}-${Date.now()}`
  return {
    id,
    type,
    label: catalog?.label ?? type,
    x: 10,
    y: 10,
    width: 30,
    height: 15,
    appearance: { ...DEFAULT_APPEARANCE },
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
  }
}

export function CalendarDesignStudio() {
  const { mealTemplates, addCalendarEvent, updateMealTemplate } = useDemo()
  const [doc, setDoc] = useState<CalendarDesignDocument>(() => loadDesignDocument())
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [cookbookDay, setCookbookDay] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [viewport, setViewport] = useState<ViewportMode>("desktop")
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [showLayers, setShowLayers] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
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
      return
    }
  }, [])

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
      const el = createElementFromCatalog(type)
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId ? { ...p, elements: [...p.elements, el] } : p
        ),
      }))
      setSelectedElementId(el.id)
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
        label: template.name,
        x: 5,
        y: 55,
        width: 28,
        height: 18,
        appearance: { ...DEFAULT_APPEARANCE },
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
    const newPage = createDefaultPage(nextMonth, nextYear)
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

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col overflow-hidden">
      <DesignToolbar
        zoom={zoom}
        viewport={viewport}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        showLayers={showLayers}
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
        onPublish={() => alert("Calendar published successfully!")}
      />

      <div className="flex flex-1 overflow-hidden">
        <ElementsPanel
          activeThemeId={activePage.themeId}
          onAddElement={handleAddElement}
          onApplyTheme={handleApplyTheme}
          mealTemplates={mealTemplates}
          onAddFromCookbook={handleAddFromCookbook}
          cookbookDay={cookbookDay}
          onCookbookDayChange={setCookbookDay}
        />
        <DesignCanvas
          page={activePage}
          zoom={zoom}
          viewport={viewport}
          showGrid={showGrid}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
        />
        <PropertiesPanel
          page={activePage}
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onUpdatePage={handleUpdatePage}
          onUpdateAppearance={handleUpdateAppearance}
          onUpdateStaffPick={handleUpdateStaffPick}
          onUpdateDailyBite={handleUpdateDailyBite}
        />
      </div>

      <PageStrip
        pages={doc.pages}
        activePageId={doc.activePageId}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
      />

      <ExportDesignModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  )
}
