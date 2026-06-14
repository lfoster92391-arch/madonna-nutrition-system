"use client"

import { ADD_FUNDS_MAX, ADD_FUNDS_MIN, PRESET_AMOUNTS } from "@/lib/payments/schemas"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type QuickAmountPickerProps = {
  selectedAmount: number | "custom"
  onSelectAmount: (amount: number | "custom") => void
  customAmount: string
  onCustomAmountChange: (value: string) => void
  suggestedAmount?: number
  compact?: boolean
}

export function QuickAmountPicker({
  selectedAmount,
  onSelectAmount,
  customAmount,
  onCustomAmountChange,
  suggestedAmount,
  compact = false,
}: QuickAmountPickerProps) {
  const presets = suggestedAmount && !PRESET_AMOUNTS.includes(suggestedAmount as (typeof PRESET_AMOUNTS)[number])
    ? [...PRESET_AMOUNTS, suggestedAmount]
    : [...PRESET_AMOUNTS]

  return (
    <div className="space-y-3">
      {suggestedAmount != null && suggestedAmount > 0 && (
        <p className="text-sm text-[#64748B]">
          Suggested deposit:{" "}
          <button
            type="button"
            onClick={() => onSelectAmount(suggestedAmount)}
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            ${suggestedAmount}
          </button>
        </p>
      )}

      <div className={cn("grid gap-2", compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
        {presets.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onSelectAmount(amount)}
            className={cn(
              "rounded-2xl border px-3 py-2.5 text-center text-sm font-bold transition",
              selectedAmount === amount
                ? "border-primary bg-primary text-white"
                : "border-silver/50 text-primary hover:border-primary/40"
            )}
          >
            ${amount}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSelectAmount("custom")}
          className={cn(
            "rounded-2xl border px-3 py-2.5 text-center text-sm font-bold transition",
            selectedAmount === "custom"
              ? "border-primary bg-primary text-white"
              : "border-silver/50 text-primary hover:border-primary/40"
          )}
        >
          Custom
        </button>
      </div>

      {selectedAmount === "custom" && (
        <div>
          <label htmlFor="quick-custom-amount" className="text-sm font-medium text-primary">
            Custom amount (${ADD_FUNDS_MIN}–${ADD_FUNDS_MAX})
          </label>
          <Input
            id="quick-custom-amount"
            type="number"
            min={ADD_FUNDS_MIN}
            max={ADD_FUNDS_MAX}
            step="0.01"
            value={customAmount}
            onChange={(e) => onCustomAmountChange(e.target.value)}
            placeholder="Enter amount"
            className="mt-2 max-w-xs"
          />
        </div>
      )}
    </div>
  )
}
