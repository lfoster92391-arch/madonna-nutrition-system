import { cn } from "@/lib/utils"

/** Shared matte navy option button classes (see `.madonna-option-btn` in globals.css). */
export function madonnaOptionBtn({
  active,
  shape = "rounded",
  className,
}: {
  active?: boolean
  shape?: "rounded" | "pill"
  className?: string
} = {}) {
  return cn(
    "madonna-option-btn",
    shape === "pill" ? "madonna-option-btn--pill" : "madonna-option-btn--rounded",
    active && "madonna-option-btn--active",
    className
  )
}
