"use client"

import { Label, Select } from "@/components/ui/input"
import {
  DEFAULT_PIZZA_SLICES,
  MAX_PIZZA_SLICES,
  MIN_PIZZA_SLICES,
  PIZZA_SLICE_UNIT_PRICE,
  pizzaSliceTotal,
} from "@/lib/pizza-day"
import { formatCurrency } from "@/lib/utils"

type PizzaSlicePickerProps = {
  sliceCount: number
  onChange: (sliceCount: number) => void
  id?: string
  className?: string
  /** When false, hide the running total line (e.g. parent shows it elsewhere). */
  showTotal?: boolean
}

const SLICE_OPTIONS = Array.from(
  { length: MAX_PIZZA_SLICES - MIN_PIZZA_SLICES + 1 },
  (_, i) => MIN_PIZZA_SLICES + i
)

export function PizzaSlicePicker({
  sliceCount,
  onChange,
  id = "pizza-slice-count",
  className = "",
  showTotal = true,
}: PizzaSlicePickerProps) {
  const safeCount = Number.isFinite(sliceCount) ? sliceCount : DEFAULT_PIZZA_SLICES
  const total = pizzaSliceTotal(safeCount)

  return (
    <div className={className}>
      <Label htmlFor={id}>How many slices?</Label>
      <Select
        id={id}
        value={String(safeCount)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1"
      >
        {SLICE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? "slice" : "slices"} ({formatCurrency(PIZZA_SLICE_UNIT_PRICE)} each)
          </option>
        ))}
      </Select>
      {showTotal ? (
        <p className="mt-2 text-sm font-semibold text-[#041B52]" aria-live="polite">
          Total: {formatCurrency(total)}
        </p>
      ) : null}
    </div>
  )
}
