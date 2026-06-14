import { createDefaultDocument } from "@/lib/calendar-design/defaults"
import type { CalendarDesignDocument } from "@/lib/calendar-design/types"

const STORAGE_KEY = "madonna-calendar-design-v1"

export function loadDesignDocument(): CalendarDesignDocument {
  if (typeof window === "undefined") return createDefaultDocument()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultDocument()
    const parsed = JSON.parse(raw) as CalendarDesignDocument
    if (!parsed.pages?.length) return createDefaultDocument()
    return parsed
  } catch {
    return createDefaultDocument()
  }
}

export function saveDesignDocument(doc: CalendarDesignDocument): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...doc, updatedAt: new Date().toISOString() }))
}

export function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}
