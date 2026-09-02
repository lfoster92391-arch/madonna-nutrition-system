"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calculator, Lock } from "lucide-react"
import { ScanKeypad } from "@/components/scan/ScanKeypad"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const KIOSK_UNLOCK_STORAGE_KEY = "mnms-kiosk-unlocked"

export function setKioskUnlocked() {
  sessionStorage.setItem(
    KIOSK_UNLOCK_STORAGE_KEY,
    JSON.stringify({ at: Date.now() })
  )
}

export function isKioskUnlocked(): boolean {
  try {
    const raw = sessionStorage.getItem(KIOSK_UNLOCK_STORAGE_KEY)
    if (!raw) return false
    JSON.parse(raw)
    return true
  } catch {
    return false
  }
}

type KioskPinGateProps = {
  returnTo?: string
}

export function KioskPinGate({ returnTo = "/kiosk" }: KioskPinGateProps) {
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const verify = useCallback(
    async (candidate: string) => {
      if (candidate.length !== 4) return
      setVerifying(true)
      setError(null)
      try {
        const res = await fetch("/api/kiosk/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: candidate }),
        })
        const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
        if (!res.ok || !json?.ok) {
          setError(json?.error || "Incorrect PIN. Try again.")
          setPin("")
          return
        }
        setKioskUnlocked()
        router.replace(returnTo)
      } catch {
        setError("Could not verify PIN. Check your connection and try again.")
        setPin("")
      } finally {
        setVerifying(false)
      }
    },
    [returnTo, router]
  )

  useEffect(() => {
    if (pin.length === 4) void verify(pin)
  }, [pin, verify])

  function appendDigit(digit: string) {
    if (verifying || pin.length >= 4) return
    setError(null)
    setPin((p) => p + digit)
  }

  function backspace() {
    if (verifying) return
    setPin((p) => p.slice(0, -1))
    setError(null)
  }

  function clearPin() {
    if (verifying) return
    setPin("")
    setError(null)
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-4 py-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Calculator className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-primary">Cashier / POS</h1>
        <p className="mt-2 text-sm text-silver-foreground">
          Enter the 4-digit station PIN to open the lunch line register.
        </p>
      </div>

      <div
        className="mx-auto mt-8 flex h-14 w-full max-w-xs items-center justify-center gap-3 rounded-2xl border border-[#AEB6C2] bg-white px-4"
        aria-live="polite"
        aria-label="PIN entry"
      >
        <Lock className="h-5 w-5 shrink-0 text-silver-foreground" aria-hidden />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="flex h-3 w-3 items-center justify-center rounded-full bg-[#E8EBF0]"
              aria-hidden
            >
              {pin.length > i ? (
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              ) : null}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mx-auto mt-4 max-w-xs rounded-xl border border-danger/40 bg-danger/5 px-4 py-3 text-center text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="mx-auto mt-6 w-full max-w-xs">
        <ScanKeypad
          variant="v2"
          disabled={verifying}
          onDigit={appendDigit}
          onBackspace={backspace}
          onClear={clearPin}
          onEnter={() => void verify(pin)}
        />
      </div>

      <div className="mt-8 text-center">
        <Button asChild variant="ghost" size="sm">
          <Link href="/access/school">Back to School Access</Link>
        </Button>
      </div>
    </div>
  )
}
