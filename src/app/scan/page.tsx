"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  CupSoda,
  GraduationCap,
  IdCard,
  Menu,
  Plus,
  ScanLine,
  Settings,
  ShoppingBag,
  Utensils,
  Users,
  Wallet,
  Wine,
} from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { getAllergyBannerStyle, getHighestAllergySeverity } from "@/data/demo"
import { ScanKeypad } from "@/components/scan/ScanKeypad"
import { MEAL_PRICES } from "@/lib/types"
import type { Student, Transaction } from "@/lib/types"
import { checkMealCompatibility } from "@/lib/food-safety"
import { cn, formatCurrency } from "@/lib/utils"

const MEAL_RESET_MS = 1200
const ERROR_RESET_MS = 2000
const FLASH_DISMISS_MS = 2000

const MEAL_ICONS: Record<string, typeof Utensils> = {
  student_meal: Utensils,
  staff_meal: Users,
  ala_carte: ShoppingBag,
  milk: Wine,
}

type ScanPhase = "ready" | "scanning" | "found" | "complete" | "error"

function formatKioskTime(date: Date = new Date()) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatKioskDate(date: Date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function formatTxTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function StatusDot({ phase }: { phase: ScanPhase }) {
  if (phase === "scanning") {
    return (
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
        <span className="scan-ready-dot scan-ready-dot--amber relative inline-flex h-3 w-3 rounded-full" />
      </span>
    )
  }
  if (phase === "error") {
    return (
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
        <span className="scan-ready-dot scan-ready-dot--red relative inline-flex h-3 w-3 rounded-full" />
      </span>
    )
  }
  return (
    <span className="relative flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
      <span className="scan-ready-ring scan-ready-ring--green absolute inline-flex h-4 w-4 rounded-full" />
      <span className="scan-ready-dot scan-ready-dot--green relative inline-flex h-3 w-3 rounded-full" />
    </span>
  )
}

function RecentActivityItem({ tx }: { tx: Transaction }) {
  const isDeposit = tx.type === "deposit" || tx.meal.toLowerCase().includes("fund")
  const label = isDeposit ? "Added Funds" : tx.meal

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-[#64748B]">
      <span className="shrink-0 tabular-nums">{formatTxTime(tx.timestamp)}</span>
      <span className="shrink-0 text-[#AEB6C2]">|</span>
      {isDeposit ? (
        <Plus className="h-3.5 w-3.5 shrink-0 text-[#041B52]" aria-hidden />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#00A83E]" aria-hidden />
      )}
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "shrink-0 font-semibold tabular-nums",
          isDeposit ? "text-[#00A83E]" : "text-[#D62828]"
        )}
      >
        {isDeposit ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
      </span>
    </div>
  )
}

export default function ScanStationPage() {
  const { students, transactions, processMeal } = useDemo()
  const [clock, setClock] = useState(formatKioskTime())
  const [dateStr, setDateStr] = useState("")
  const [scanValue, setScanValue] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
  const [localBalance, setLocalBalance] = useState(0)
  const [scanStatus, setScanStatus] = useState<ScanPhase>("ready")
  const [flashMessage, setFlashMessage] = useState("")
  const [countdownEnd, setCountdownEnd] = useState<number | null>(null)
  const [tick, setTick] = useState(0)

  const scanInputRef = useRef<HTMLInputElement>(null)
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const highestSeverity = student ? getHighestAllergySeverity(student.allergies) : null
  const bannerStyle = highestSeverity ? getAllergyBannerStyle(highestSeverity) : null
  const mealCompatibility = student ? checkMealCompatibility(student) : null
  const mealBlocked = mealCompatibility === "BLOCKED"
  const primaryAllergy = student?.allergies[0]?.name.toUpperCase() ?? ""

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3),
    [transactions]
  )

  const nextScanSeconds = useMemo(() => {
    if (countdownEnd === null) return null
    void tick
    return Math.max(0, (countdownEnd - Date.now()) / 1000)
  }, [countdownEnd, tick])

  const primaryMeals = MEAL_PRICES.filter((m) => m.type === "student_meal" || m.type === "ala_carte")
  const secondaryMeals = MEAL_PRICES.filter((m) => m.type === "staff_meal" || m.type === "milk")

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setClock(formatKioskTime(now))
      setDateStr(formatKioskDate(now))
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (countdownEnd === null) return
    const timer = setInterval(() => setTick((t) => t + 1), 100)
    return () => clearInterval(timer)
  }, [countdownEnd])

  useEffect(() => {
    if (!student) return
    const fresh = students.find((s) => s.id === student.id)
    if (fresh) {
      setStudent(fresh)
      setLocalBalance(fresh.balance)
    }
  }, [students, student?.id])

  const focusScan = useCallback(() => {
    scanInputRef.current?.focus()
  }, [])

  const armScanner = useCallback(
    (options?: { keepStudent?: boolean }) => {
      const keepStudent = options?.keepStudent ?? false
      if (!keepStudent) setStudent(null)
      setScanStatus(keepStudent ? "found" : "ready")
      setScanValue("")
      setCountdownEnd(null)
      window.setTimeout(focusScan, 50)
    },
    [focusScan]
  )

  useEffect(() => {
    focusScan()
    const interval = setInterval(focusScan, 2000)
    return () => clearInterval(interval)
  }, [focusScan])

  useEffect(() => {
    if (!flashMessage) return
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlashMessage(""), FLASH_DISMISS_MS)
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [flashMessage])

  useEffect(() => {
    if (scanStatus !== "error") return
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => armScanner(), ERROR_RESET_MS)
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [scanStatus, armScanner])

  const loadStudent = useCallback(
    (found: Student) => {
      if (found.disabled) {
        setScanStatus("error")
        setFlashMessage("Student account is disabled.")
        setScanValue("")
        window.setTimeout(focusScan, 50)
        return
      }
      setStudent(found)
      setLocalBalance(found.balance)
      setScanStatus("found")
      setScanValue("")
      setFlashMessage("")
      window.setTimeout(focusScan, 50)
    },
    [focusScan]
  )

  const lookupStudent = useCallback(
    (id: string) => {
      const trimmed = id.trim()
      if (!trimmed) return
      const found = students.find((s) => s.id === trimmed)
      if (!found) {
        setScanStatus("error")
        setFlashMessage("Student not found. Try again.")
        setScanValue("")
        window.setTimeout(focusScan, 50)
        return
      }
      loadStudent(found)
    },
    [students, loadStudent, focusScan]
  )

  function handleScanChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "")
    setScanValue(digitsOnly)
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
    if (digitsOnly.length >= 4) {
      setScanStatus("scanning")
      scanTimerRef.current = setTimeout(() => lookupStudent(digitsOnly), 200)
    } else if (digitsOnly.length === 0) {
      setScanStatus(student ? "found" : "ready")
    }
  }

  function appendDigit(digit: string) {
    handleScanChange(scanValue + digit)
  }

  function deleteLastDigit() {
    handleScanChange(scanValue.slice(0, -1))
  }

  function clearScanValue() {
    handleScanChange("")
  }

  function resetStation() {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    armScanner()
  }

  async function handleMeal(mealLabel: string, price: number) {
    if (!student) return
    if (mealBlocked) {
      setFlashMessage("MEAL BLOCKED — Allergy conflict. Do not serve today's meal.")
      window.setTimeout(focusScan, 50)
      return
    }
    const tx = await processMeal(student.id, mealLabel, price)
    if (tx) {
      setLocalBalance(tx.balanceAfter)
      setFlashMessage(`${mealLabel} recorded for ${student.firstName}!`)
      setScanStatus("complete")
      setCountdownEnd(Date.now() + MEAL_RESET_MS)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      resetTimerRef.current = setTimeout(resetStation, MEAL_RESET_MS)
      window.setTimeout(focusScan, 50)
    }
  }

  const statusLabel =
    scanStatus === "scanning"
      ? "PROCESSING"
      : scanStatus === "complete"
        ? "COMPLETE"
        : scanStatus === "error"
          ? "NOT FOUND"
          : "READY TO SCAN"

  const statusColor =
    scanStatus === "scanning"
      ? "text-amber-400"
      : scanStatus === "error"
        ? "text-[#D62828]"
        : "text-[#00A83E]"

  const statusSubtitle =
    scanStatus === "scanning"
      ? "Reading badge — hold still"
      : scanStatus === "error"
        ? "Badge not recognized — scanner will re-arm automatically"
        : scanStatus === "complete"
          ? flashMessage || "Transaction recorded"
          : "Scan badge or enter ID"

  const studentMealAvailable =
    student && !mealBlocked && primaryMeals.find((m) => m.type === "student_meal")

  function renderMealButton(meal: (typeof MEAL_PRICES)[number], compact = false) {
    const Icon = MEAL_ICONS[meal.type] ?? Utensils
    const gradeRestricted = meal.grades && student && !meal.grades.includes(student.grade)
    const blocked = mealBlocked
    const disabled = !student || !!gradeRestricted || blocked
    const isStudentMeal = meal.type === "student_meal"
    const isSelected = !!student && isStudentMeal && !disabled && scanStatus !== "complete"

    if (gradeRestricted && meal.type === "ala_carte") return null

    return (
      <button
        key={meal.type}
        type="button"
        disabled={disabled}
        onClick={() => handleMeal(meal.label, meal.price)}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border transition disabled:cursor-not-allowed disabled:opacity-40",
          compact ? "min-h-[64px] gap-1 px-3 py-3" : "min-h-[120px] flex-1 gap-2 px-4 py-5 lg:min-h-[140px]",
          isSelected
            ? "border-[#00A83E] bg-[#00A83E] text-white"
            : meal.type === "ala_carte"
              ? "border-[#AEB6C2] bg-white text-[#041B52]"
              : blocked
                ? "border-[#D62828] bg-[#D62828] text-white"
                : "border-[#AEB6C2] bg-white text-[#111827]"
        )}
      >
        {isSelected && (
          <span className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <Check className="h-4 w-4 text-white" strokeWidth={3} aria-hidden />
          </span>
        )}
        <div className="flex items-center gap-2">
          <Icon
            className={cn(compact ? "h-6 w-6" : "h-8 w-8", isSelected ? "text-white" : "text-[#041B52]")}
            aria-hidden
          />
          {meal.type === "student_meal" && !compact && (
            <CupSoda
              className={cn("h-7 w-7", isSelected ? "text-white" : "text-[#041B52]")}
              aria-hidden
            />
          )}
          {meal.type === "ala_carte" && !compact && (
            <Wine className="h-7 w-7 text-[#041B52]" aria-hidden />
          )}
        </div>
        <span className={cn("font-bold", compact ? "text-sm" : "text-lg lg:text-xl")}>
          {blocked && isStudentMeal ? "BLOCKED" : meal.label.toUpperCase()}
        </span>
        {meal.type === "ala_carte" && !compact && (
          <span className="text-xs font-medium text-[#64748B]">Available Grades 9–12</span>
        )}
      </button>
    )
  }

  return (
    <div className="scan-station-v2 flex h-full flex-col overflow-hidden bg-white text-[#111827]">
      <header className="flex h-[90px] shrink-0 items-center justify-between border-[1.5px] border-[#AEB6C2] border-b-[#AEB6C2]/60 bg-[#041B52] px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <ScanLine className="h-6 w-6 text-white" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <StatusDot phase={scanStatus} />
              <p className={cn("text-xl font-bold tracking-wide lg:text-2xl", statusColor)}>
                {statusLabel}
              </p>
              {nextScanSeconds !== null && nextScanSeconds > 0 && (
                <p className="text-sm font-semibold text-[#00A83E] lg:text-base">
                  Next Scan: {nextScanSeconds.toFixed(1)}s
                </p>
              )}
            </div>
            <p className="truncate text-sm text-white/70 lg:text-base">{statusSubtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 lg:gap-6">
          <div className="hidden text-right text-white sm:block">
            <p className="text-2xl font-bold tabular-nums lg:text-3xl">{clock}</p>
            <p className="text-sm text-white/70">{dateStr}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Settings className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">MENU</span>
            <Menu className="h-4 w-4 sm:hidden" aria-hidden />
          </Link>
        </div>
      </header>

      <main className="flex min-h-0 flex-1">
        <section className="flex w-[55%] min-w-0 flex-col border-r border-[#AEB6C2]/60 p-4 lg:p-6">
          {student ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex gap-4">
                <Image
                  src={student.photo}
                  alt={`${student.firstName} ${student.lastName}`}
                  width={120}
                  height={120}
                  className="h-[100px] w-[100px] shrink-0 rounded-2xl border border-[#AEB6C2] object-cover lg:h-[120px] lg:w-[120px]"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-2xl font-bold uppercase tracking-tight lg:text-3xl">
                    {student.firstName} {student.lastName}
                  </h2>
                  <p className="mt-1 flex items-center gap-2 text-base text-[#64748B] lg:text-lg">
                    <GraduationCap className="h-5 w-5 shrink-0" aria-hidden />
                    Grade {student.grade}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-base text-[#64748B] lg:text-lg">
                    <IdCard className="h-5 w-5 shrink-0" aria-hidden />
                    ID: {student.id}
                  </p>
                </div>
              </div>

              {student.allergies.length > 0 && bannerStyle && (
                <div className="scan-allergy-alert rounded-2xl border-2 border-[#D62828] bg-[#FEF2F2] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-[#D62828]" aria-hidden />
                    <p className="text-sm font-bold uppercase tracking-wide text-[#D62828]">
                      Allergy Alert
                    </p>
                  </div>
                  <p className="mt-2 text-lg font-bold text-[#D62828] lg:text-xl">
                    {primaryAllergy || bannerStyle.label}
                  </p>
                  {mealBlocked && (
                    <p className="mt-1 text-sm font-semibold text-[#D62828]">
                      Meal Compatibility: BLOCKED
                    </p>
                  )}
                </div>
              )}

              <div className="mt-auto rounded-2xl border border-[#AEB6C2] bg-white p-4 lg:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00A83E]/10">
                    <Wallet className="h-5 w-5 text-[#00A83E]" aria-hidden />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Account Balance
                  </p>
                </div>
                <p
                  className={cn(
                    "mt-2 text-4xl font-bold tabular-nums lg:text-5xl",
                    localBalance <= 0 ? "text-[#D62828]" : "text-[#00A83E]"
                  )}
                >
                  {formatCurrency(localBalance)}
                </p>
                <Link
                  href="/parent/add-funds"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#00A83E] py-3 text-base font-bold text-[#00A83E] transition hover:bg-[#00A83E]/5"
                >
                  <Plus className="h-5 w-5" aria-hidden />
                  ADD FUNDS
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-[#64748B]">
              <StatusDot phase={scanStatus} />
              <p className="mt-4 text-xl font-bold text-[#041B52]">Ready to scan</p>
              <p className="mt-2 text-sm lg:text-base">
                Demo student: 10457 — James Anderson (peanut allergy)
              </p>
            </div>
          )}
        </section>

        <section className="flex w-[45%] min-w-0 flex-col p-4 lg:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Select Meal</p>

          <div className="mt-3 flex gap-3">
            {primaryMeals.map((meal) => renderMealButton(meal))}
          </div>

          {secondaryMeals.length > 0 && (
            <div className="mt-3 flex gap-3">
              {secondaryMeals.map((meal) => renderMealButton(meal, true))}
            </div>
          )}

          {studentMealAvailable && scanStatus !== "complete" && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#00A83E]/40 bg-[#00A83E]/10 px-4 py-2.5">
              <BadgeCheck className="h-5 w-5 shrink-0 text-[#00A83E]" aria-hidden />
              <p className="text-sm font-semibold text-[#00A83E]">STUDENT MEAL SELECTED</p>
            </div>
          )}

          {flashMessage && (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "mt-3 rounded-2xl border px-4 py-3 text-sm font-semibold lg:text-base",
                flashMessage.includes("BLOCKED")
                  ? "border-[#D62828] bg-[#FEF2F2] text-[#D62828]"
                  : "border-[#00A83E] bg-[#00A83E]/10 text-[#00A83E]"
              )}
            >
              {flashMessage}
            </div>
          )}

          <div className="mt-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Enter Student ID
            </p>
            <div className="relative mt-2">
              <input
                ref={scanInputRef}
                id="badge-input"
                type="text"
                inputMode="none"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
                value={scanValue}
                onChange={(e) => handleScanChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    lookupStudent(scanValue)
                  }
                  if (e.key === "Backspace") {
                    deleteLastDigit()
                  }
                }}
                className="absolute h-px w-px opacity-0"
                aria-label="Student badge ID scanner input"
              />
              <div
                role="textbox"
                aria-readonly="true"
                aria-labelledby="badge-input"
                className="flex h-14 items-center rounded-2xl border border-[#AEB6C2] bg-[#F5F6F8] px-4 text-2xl font-bold tracking-wide text-[#111827] lg:h-16 lg:text-3xl"
              >
                {scanValue || (
                  <span className="text-lg font-normal text-[#64748B] lg:text-xl">
                    {scanValue === "" && student ? student.id : "Enter ID"}
                  </span>
                )}
              </div>
            </div>
            <ScanKeypad
              className="mt-3"
              variant="v2"
              onDigit={appendDigit}
              onBackspace={deleteLastDigit}
              onClear={clearScanValue}
              onEnter={() => lookupStudent(scanValue)}
            />
          </div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-[#AEB6C2] bg-white px-5 py-3 lg:px-8">
        <div className="flex flex-wrap items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#64748B]" aria-hidden />
            <p className="text-sm font-bold uppercase tracking-wide text-[#64748B]">Recent Activity</p>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx, i) => (
                <div key={tx.id} className="flex items-center gap-6">
                  {i > 0 && <span className="hidden h-4 w-px bg-[#AEB6C2] sm:block" aria-hidden />}
                  <RecentActivityItem tx={tx} />
                </div>
              ))
            ) : (
              <p className="text-sm text-[#64748B]">No recent transactions</p>
            )}
          </div>
          <div className="hidden items-center gap-2 text-xs text-[#64748B] lg:flex">
            <CreditCard className="h-3.5 w-3.5" aria-hidden />
            <span>Station</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
