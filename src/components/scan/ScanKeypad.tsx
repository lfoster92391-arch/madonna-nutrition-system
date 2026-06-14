"use client"

import { useCallback, useRef } from "react"
import { Delete } from "lucide-react"
import { cn } from "@/lib/utils"

/** Minimum time between key presses — prevents accidental double-taps for slower users. */
export const SCAN_KEYPAD_MIN_INTERVAL_MS = 280

/** Backspace uses tap-only deletes; hold does not trigger auto-repeat. */
export const SCAN_KEYPAD_BACKSPACE_REPEAT_DELAY_MS = 0

type ScanKeypadProps = {
  onDigit: (digit: string) => void
  onBackspace: () => void
  onClear?: () => void
  disabled?: boolean
  className?: string
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const

function useDebouncedAction(intervalMs: number) {
  const lastActionRef = useRef(0)

  return useCallback(
    (action: () => void) => {
      const now = Date.now()
      if (now - lastActionRef.current < intervalMs) return
      lastActionRef.current = now
      action()
    },
    [intervalMs]
  )
}

function Key({
  label,
  onPress,
  disabled,
  className,
  ariaLabel,
  children,
}: {
  label?: string
  onPress: () => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
  children?: React.ReactNode
}) {
  const runDebounced = useDebouncedAction(SCAN_KEYPAD_MIN_INTERVAL_MS)
  const pressedRef = useRef(false)

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (disabled || pressedRef.current) return
    pressedRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (disabled || !pressedRef.current) return
    pressedRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    runDebounced(onPress)
  }

  function handlePointerCancel() {
    pressedRef.current = false
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      className={cn(
        "flex min-h-[88px] select-none items-center justify-center rounded-2xl border-2 border-[#001E62]/20 bg-white text-3xl font-bold text-[#001E62] transition active:scale-[0.98] active:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation",
        className
      )}
    >
      {children ?? label}
    </button>
  )
}

export function ScanKeypad({ onDigit, onBackspace, onClear, disabled, className }: ScanKeypadProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {DIGITS.slice(0, 9).map((digit) => (
        <Key
          key={digit}
          label={digit}
          disabled={disabled}
          onPress={() => onDigit(digit)}
        />
      ))}

      {onClear ? (
        <Key
          label="Clear"
          ariaLabel="Clear all"
          disabled={disabled}
          onPress={onClear}
          className="text-xl"
        />
      ) : (
        <div aria-hidden className="min-h-[88px]" />
      )}

      <Key label="0" disabled={disabled} onPress={() => onDigit("0")} />

      <Key
        ariaLabel="Delete one character"
        disabled={disabled}
        onPress={onBackspace}
        className="border-[#001E62]/30 bg-[#F5F6F8]"
      >
        <Delete className="h-10 w-10" strokeWidth={2.25} aria-hidden />
      </Key>
    </div>
  )
}
