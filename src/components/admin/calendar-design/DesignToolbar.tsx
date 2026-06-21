"use client"

import {
  Download,
  Eye,
  Grid3X3,
  History,
  Layers,
  Magnet,
  Monitor,
  Printer,
  Redo2,
  Save,
  Smartphone,
  Tablet,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ViewportMode } from "@/lib/calendar-design/types"

interface DesignToolbarProps {
  zoom: number
  viewport: ViewportMode
  showGrid: boolean
  snapToGrid: boolean
  showLayers: boolean
  canUndo: boolean
  canRedo: boolean
  compact?: boolean
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onViewportChange: (mode: ViewportMode) => void
  onToggleGrid: () => void
  onToggleSnap: () => void
  onToggleLayers: () => void
  onVersionHistory: () => void
  onExport: () => void
  onSave: () => void
  onPreview: () => void
  onPublish: () => void
}

const VIEWPORTS: { mode: ViewportMode; label: string; icon: typeof Monitor }[] = [
  { mode: "desktop", label: "Desktop", icon: Monitor },
  { mode: "tablet", label: "Tablet", icon: Tablet },
  { mode: "mobile", label: "Mobile", icon: Smartphone },
  { mode: "print", label: "Print", icon: Printer },
]

export function DesignToolbar({
  zoom,
  viewport,
  showGrid,
  snapToGrid,
  showLayers,
  canUndo,
  canRedo,
  compact = false,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onViewportChange,
  onToggleGrid,
  onToggleSnap,
  onToggleLayers,
  onVersionHistory,
  onExport,
  onSave,
  onPreview,
  onPublish,
}: DesignToolbarProps) {
  return (
    <header className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-silver bg-primary px-3 py-2 text-white sm:gap-3 sm:px-4">
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="min-h-9 text-white hover:bg-white/10 hover:text-white"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-9 text-white hover:bg-white/10 hover:text-white"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-6 w-px bg-white/20" />
        <Button
          variant="ghost"
          size="sm"
          className="min-h-9 text-white hover:bg-white/10 hover:text-white"
          onClick={onZoomOut}
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-[3rem] text-center text-xs font-semibold tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-9 text-white hover:bg-white/10 hover:text-white"
          onClick={onZoomIn}
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div className="mx-1 h-6 w-px bg-white/20" />

      <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white/10 p-1">
        {VIEWPORTS.filter(({ mode }) => !compact || mode === "mobile" || mode === "print").map(
          ({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewportChange(mode)}
            className={cn(
              "flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition sm:min-h-8",
              viewport === mode
                ? "bg-white text-primary"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
            title={label}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden lg:inline">{label}</span>
          </button>
          )
        )}
      </div>

      {!compact ? (
        <>
      <div className="mx-1 hidden h-6 w-px shrink-0 bg-white/20 md:block" />

      <div className="hidden shrink-0 items-center gap-1 md:flex">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "min-h-9 text-white hover:bg-white/10 hover:text-white",
            showGrid && "bg-white/20"
          )}
          onClick={onToggleGrid}
          title="Toggle grid"
        >
          <Grid3X3 className="h-4 w-4" />
          <span className="hidden md:inline">Grid</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "min-h-9 text-white hover:bg-white/10 hover:text-white",
            snapToGrid && "bg-white/20"
          )}
          onClick={onToggleSnap}
          title="Snap to grid"
        >
          <Magnet className="h-4 w-4" />
          <span className="hidden md:inline">Snap</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "min-h-9 text-white hover:bg-white/10 hover:text-white",
            showLayers && "bg-white/20"
          )}
          onClick={onToggleLayers}
          title="Toggle layers panel"
        >
          <Layers className="h-4 w-4" />
          <span className="hidden md:inline">Layers</span>
        </Button>
      </div>
        </>
      ) : null}

      <div className="min-w-2 flex-1" />

      {!compact ? (
      <Button
        variant="ghost"
        size="sm"
        className="hidden min-h-9 shrink-0 text-white hover:bg-white/10 hover:text-white md:inline-flex"
        onClick={onVersionHistory}
      >
        <History className="h-4 w-4" />
        <span className="hidden md:inline">Version History</span>
      </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className="min-h-9 shrink-0 text-white hover:bg-white/10 hover:text-white"
        onClick={onExport}
      >
        <Download className="h-4 w-4" />
        <span className={compact ? "sr-only" : undefined}>Export</span>
      </Button>

      <div className="mx-1 hidden h-6 w-px shrink-0 bg-white/20 sm:block" />

      <Button
        variant="ghost"
        size="sm"
        className="min-h-9 shrink-0 text-white hover:bg-white/10 hover:text-white"
        onClick={onSave}
      >
        <Save className="h-4 w-4" />
        <span className={compact ? "sr-only" : undefined}>Save</span>
      </Button>
      {!compact ? (
      <Button
        variant="secondary"
        size="sm"
        className="hidden min-h-9 shrink-0 bg-white/15 text-white hover:bg-white/25 sm:inline-flex"
        onClick={onPreview}
      >
        <Eye className="h-4 w-4" />
        Preview
      </Button>
      ) : null}
      <Button
        variant="success"
        size="sm"
        className="min-h-9 shrink-0"
        onClick={onPublish}
      >
        <Upload className="h-4 w-4" />
        <span className={compact ? "sr-only" : undefined}>Publish</span>
      </Button>
    </header>
  )
}
