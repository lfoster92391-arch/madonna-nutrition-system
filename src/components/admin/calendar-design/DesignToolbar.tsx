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
    <header className="flex shrink-0 items-center gap-3 border-b border-silver bg-primary px-4 py-2 text-white">
      <div className="flex items-center gap-1">
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

      <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
        {VIEWPORTS.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewportChange(mode)}
            className={cn(
              "flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition",
              viewport === mode
                ? "bg-white text-primary"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
            title={label}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-white/20" />

      <div className="flex items-center gap-1">
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

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        className="min-h-9 text-white hover:bg-white/10 hover:text-white"
        onClick={onVersionHistory}
      >
        <History className="h-4 w-4" />
        <span className="hidden md:inline">Version History</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="min-h-9 text-white hover:bg-white/10 hover:text-white"
        onClick={onExport}
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <div className="mx-1 h-6 w-px bg-white/20" />

      <Button
        variant="ghost"
        size="sm"
        className="min-h-9 text-white hover:bg-white/10 hover:text-white"
        onClick={onSave}
      >
        <Save className="h-4 w-4" />
        Save
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="min-h-9 bg-white/15 text-white hover:bg-white/25"
        onClick={onPreview}
      >
        <Eye className="h-4 w-4" />
        Preview
      </Button>
      <Button
        variant="success"
        size="sm"
        className="min-h-9"
        onClick={onPublish}
      >
        <Upload className="h-4 w-4" />
        Publish
      </Button>
    </header>
  )
}
