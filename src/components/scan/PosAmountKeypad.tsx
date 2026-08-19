"use client"

import { useCallback, useRef } from "react"
import { SCAN_KEYPAD_MIN_INTERVAL_MS } from "@/components/scan/ScanKeypad"
import { cn, formatCurrency } from "@/lib/utils"

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const
const MAX_CENTS = 99_999

export function appendPosDigit(currentCents: number, digit: string): number {
  if (!/^\d$/.test(digit)) return currentCents
  const next = currentCents * 10 + Number(digit)
  return Math.min(next, MAX_CENTS)
}

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
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
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
      {label}
    </button>
  )
}

type PosAmountKeypadProps = {
  cents: number
  onCentsChange: (cents: number) => void
  onCharge: (amount: number) => void
  disabled?: boolean
  className?: string
}

export function PosAmountKeypad({
  cents,
  onCentsChange,
  onCharge,
  disabled,
  className,
}: PosAmountKeypadProps) {
  const amount = cents / 100
  const canCharge = cents > 0 && !disabled

  const digitClass =
    "scan-keypad-v2__key flex select-none items-center justify-center rounded-xl border border-[#AEB6C2] bg-white font-bold text-[#111827] transition active:scale-[0.98] active:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation sm:rounded-2xl"

  const clearClass = cn(
    digitClass,
    "scan-keypad-v2__clear border-[#AEB6C2] bg-[#E8EBF0] font-semibold text-[#64748B]"
  )

  const chargeClass =
    "scan-keypad-v2__enter flex select-none items-center justify-center rounded-xl border border-[#00A83E] bg-[#00A83E] font-bold text-white transition active:scale-[0.98] active:bg-[#009234] disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation sm:rounded-2xl"

  return (
    <div className={cn("scan-keypad-v2 grid grid-cols-3", className)}>
      {DIGITS.slice(0, 9).map((digit) => (
        <Key
          key={digit}
          label={digit}
          disabled={disabled}
          onPress={() => onCentsChange(appendPosDigit(cents, digit))}
          className={digitClass}
        />
      ))}

      <Key
        label="CLEAR"
        ariaLabel="Clear price"
        disabled={disabled}
        onPress={() => onCentsChange(0)}
        className={clearClass}
      />

      <Key
        label="0"
        disabled={disabled}
        onPress={() => onCentsChange(appendPosDigit(cents, "0"))}
        className={digitClass}
      />

      <Key
        label="CHARGE"
        ariaLabel={`Charge ${formatCurrency(amount)}`}
        disabled={!canCharge}
        onPress={() => onCharge(amount)}
        className={chargeClass}
      />
    </div>
  )
}
