"use client"

import { cn } from "@/lib/utils"

export function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 rounded-[14px] border border-silver/60 px-4 py-3",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div>
        <span className="text-sm font-medium text-primary">{label}</span>
        {description && (
          <p className="mt-0.5 text-xs text-silver-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-success" : "bg-silver/60"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </label>
  )
}
