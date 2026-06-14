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
  onEnter?: () => void
  disabled?: boolean
  className?: string
  variant?: "default" | "v2"
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
      className={className}
    >
      {children ?? label}
    </button>
  )
}

export function ScanKeypad({
  onDigit,
  onBackspace,
  onClear,
  onEnter,
  disabled,
  className,
  variant = "default",
}: ScanKeypadProps) {
  const isV2 = variant === "v2"

  const digitClass = isV2
    ? "scan-keypad-v2__key flex select-none items-center justify-center rounded-xl border border-[#AEB6C2] bg-white font-bold text-[#111827] transition active:scale-[0.98] active:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation sm:rounded-2xl"
    : "flex min-h-[88px] select-none items-center justify-center rounded-2xl border-2 border-[#001E62]/20 bg-white text-3xl font-bold text-[#001E62] transition active:scale-[0.98] active:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation"

  const clearClass = isV2
    ? cn(
        digitClass,
        "scan-keypad-v2__clear border-[#AEB6C2] bg-[#E8EBF0] font-semibold text-[#64748B]"
      )
    : cn(digitClass, "text-xl")

  const enterClass = isV2
    ? "scan-keypad-v2__enter flex select-none items-center justify-center rounded-xl border border-[#00A83E] bg-[#00A83E] font-bold text-white transition active:scale-[0.98] active:bg-[#009234] disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation sm:rounded-2xl"
    : cn(digitClass, "border-[#001E62]/30 bg-[#F5F6F8]")

  return (
    <div className={cn(isV2 ? "scan-keypad-v2 grid grid-cols-3" : "grid grid-cols-3 gap-1.5 lg:gap-2", className)}>
      {DIGITS.slice(0, 9).map((digit) => (
        <Key
          key={digit}
          label={digit}
          disabled={disabled}
          onPress={() => onDigit(digit)}
          className={digitClass}
        />
      ))}

      {onClear ? (
        <Key
          label="CLEAR"
          ariaLabel="Clear all"
          disabled={disabled}
          onPress={onClear}
          className={clearClass}
        />
      ) : (
        <div aria-hidden className={isV2 ? "scan-keypad-v2__spacer" : "min-h-[68px] lg:min-h-[72px]"} />
      )}

      <Key label="0" disabled={disabled} onPress={() => onDigit("0")} className={digitClass} />

      {onEnter ? (
        <Key
          label="ENTER"
          ariaLabel="Enter student ID"
          disabled={disabled}
          onPress={onEnter}
          className={enterClass}
        />
      ) : (
        <Key
          ariaLabel="Delete one character"
          disabled={disabled}
          onPress={onBackspace}
          className={enterClass}
        >
          <Delete className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" strokeWidth={2.25} aria-hidden />
        </Key>
      )}
    </div>
  )
}
