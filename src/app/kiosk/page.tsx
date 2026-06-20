"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
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
import { getAllergyBannerStyle, getHighestAllergySeverity } from "@/lib/allergy-display"
import { ScanKeypad } from "@/components/scan/ScanKeypad"
import { OfflineBanner } from "@/components/scan/OfflineBanner"
import { MEAL_PRICES } from "@/lib/types"
import type { Student, Transaction } from "@/lib/types"
import { checkMealCompatibility } from "@/lib/food-safety"
import {
  cachedToStudent,
  findCachedStudent,
  getPendingTransactions,
  queueTransaction,
  updateCachedStudentBalance,
} from "@/lib/offline/scan-offline-db"
import {
  createQueuedTransaction,
  isBrowserOnline,
  refreshStudentCache,
  refreshStudentCacheFromServer,
  syncPendingTransactions,
} from "@/lib/offline/sync-manager"
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

function StatusDot({ phase, isOffline }: { phase: ScanPhase; isOffline?: boolean }) {
  if (isOffline && (phase === "ready" || phase === "found")) {
    return (
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
        <span className="scan-ready-dot scan-ready-dot--amber relative inline-flex h-3 w-3 rounded-full" />
      </span>
    )
  }
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
  const queryClient = useQueryClient()
  const [clock, setClock] = useState(formatKioskTime())
  const [dateStr, setDateStr] = useState("")
  const [scanValue, setScanValue] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
  const [localBalance, setLocalBalance] = useState(0)
  const [scanStatus, setScanStatus] = useState<ScanPhase>("ready")
  const [flashMessage, setFlashMessage] = useState("")
  const [countdownEnd, setCountdownEnd] = useState<number | null>(null)
  const [tick, setTick] = useState(0)
  const [isOffline, setIsOffline] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState("")
  const [pendingCount, setPendingCount] = useState(0)
  const [offlineRecent, setOfflineRecent] = useState<Transaction[]>([])

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

  const recentTransactions = useMemo(() => {
    if (isOffline && offlineRecent.length > 0) {
      return offlineRecent.slice(0, 3)
    }
    return [...transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3)
  }, [transactions, isOffline, offlineRecent])

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

  const finishSync = useCallback(
    async (result: Awaited<ReturnType<typeof syncPendingTransactions>>) => {
      if (!result.ok) {
        setIsOffline(true)
        return
      }
      setSyncMessage(result.message)
      setPendingCount(0)
      setOfflineRecent([])
      setIsOffline(false)
      if (result.balances) {
        if (student) {
          const trueBalance = result.balances[student.id]
          if (trueBalance !== undefined) {
            setLocalBalance(trueBalance)
            setStudent((prev) => (prev ? { ...prev, balance: trueBalance } : prev))
          }
        }
      }
      try {
        await refreshStudentCacheFromServer()
      } catch {
        if (students.length > 0) {
          await refreshStudentCache(students).catch(() => undefined)
        }
      }
      void queryClient.invalidateQueries({ queryKey: ["students"] })
      void queryClient.invalidateQueries({ queryKey: ["transactions"] })
      window.setTimeout(() => setSyncMessage(""), 4000)
    },
    [student, students, queryClient]
  )

  useEffect(() => {
    setIsOffline(!isBrowserOnline())
    void getPendingTransactions().then(async (txs) => {
      setPendingCount(txs.length)
      if (txs.length > 0 && isBrowserOnline()) {
        setIsSyncing(true)
        const result = await syncPendingTransactions({
          demoReplay: async (tx) => processMeal(tx.studentId, tx.mealType, tx.amount),
        })
        setIsSyncing(false)
        await finishSync(result)
      }
    })
  }, [processMeal, finishSync])

  useEffect(() => {
    if (isOffline || students.length === 0) return
    void refreshStudentCache(students).catch(() => setIsOffline(true))
  }, [students, isOffline])

  useEffect(() => {
    const handleOffline = () => setIsOffline(true)

    const handleOnline = async () => {
      setIsSyncing(true)
      setSyncMessage("")
      const result = await syncPendingTransactions({
        demoReplay: async (tx) => processMeal(tx.studentId, tx.mealType, tx.amount),
      })
      setIsSyncing(false)
      await finishSync(result)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [finishSync])

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
    async (id: string) => {
      const trimmed = id.trim()
      if (!trimmed) return

      if (isOffline) {
        const cached = await findCachedStudent(trimmed)
        if (!cached) {
          setScanStatus("error")
          setFlashMessage("Student not in offline cache.")
          setScanValue("")
          window.setTimeout(focusScan, 50)
          return
        }
        loadStudent(cachedToStudent(cached))
        return
      }

      const found = students.find((s) => s.id === trimmed)
      if (found) {
        loadStudent(found)
        return
      }

      const cached = await findCachedStudent(trimmed)
      if (cached) {
        loadStudent(cachedToStudent(cached))
        return
      }

      setScanStatus("error")
      setFlashMessage("Student not found. Try again.")
      setScanValue("")
      window.setTimeout(focusScan, 50)
    },
    [students, loadStudent, focusScan, isOffline]
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
      setFlashMessage("MEAL BLOCKED ΓÇö Allergy conflict. Do not serve today's meal.")
      window.setTimeout(focusScan, 50)
      return
    }

    const recordOfflineMeal = async () => {
      const balanceAfter = localBalance - price
      const queued = createQueuedTransaction({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        mealType: mealLabel,
        amount: price,
        balanceAfter,
      })
      await queueTransaction(queued)
      await updateCachedStudentBalance(student.id, balanceAfter)
      setLocalBalance(balanceAfter)
      setPendingCount((count) => count + 1)
      setOfflineRecent((prev) => [
        {
          id: queued.clientTxId,
          studentId: student.id,
          studentName: queued.studentName,
          meal: mealLabel,
          amount: price,
          balanceAfter,
          timestamp: queued.timestamp,
          processedByName: "Station",
        },
        ...prev,
      ])
      setFlashMessage(`${mealLabel} recorded for ${student.firstName}! (offline)`)
      setScanStatus("complete")
      setCountdownEnd(Date.now() + MEAL_RESET_MS)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      resetTimerRef.current = setTimeout(resetStation, MEAL_RESET_MS)
      window.setTimeout(focusScan, 50)
    }

    if (isOffline) {
      await recordOfflineMeal()
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
      return
    }

    setIsOffline(true)
    await recordOfflineMeal()
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
    isOffline && scanStatus !== "error" && scanStatus !== "complete"
      ? "text-amber-400"
      : scanStatus === "scanning"
        ? "text-amber-400"
        : scanStatus === "error"
          ? "text-[#D62828]"
          : "text-[#00A83E]"

  const statusSubtitle =
    scanStatus === "scanning"
      ? "Reading badge ΓÇö hold still"
      : scanStatus === "error"
        ? "Badge not recognized ΓÇö scanner will re-arm automatically"
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
          "relative flex flex-col items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-2xl",
          compact
            ? "min-h-[40px] gap-0.5 px-2 py-1.5 sm:min-h-[47px] sm:gap-1 sm:px-2.5 sm:py-2 md:min-h-[50px] lg:min-h-[58px]"
            : "min-h-[65px] flex-1 gap-1 px-2 py-2.5 sm:min-h-[79px] sm:gap-1 sm:px-3 sm:py-3 md:min-h-[90px] lg:min-h-[108px] lg:gap-1.5 lg:px-3 lg:py-4 xl:min-h-[126px]",
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
          <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 sm:left-3 sm:top-3 sm:h-6 sm:w-6">
            <Check className="h-3 w-3 text-white sm:h-4 sm:w-4" strokeWidth={3} aria-hidden />
          </span>
        )}
        <div className="flex items-center gap-1 sm:gap-2">
          <Icon
            className={cn(
              compact ? "h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" : "h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8",
              isSelected ? "text-white" : "text-[#041B52]"
            )}
            aria-hidden
          />
          {meal.type === "student_meal" && !compact && (
            <CupSoda
              className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7",
                isSelected ? "text-white" : "text-[#041B52]"
              )}
              aria-hidden
            />
          )}
          {meal.type === "ala_carte" && !compact && (
            <Wine className="h-4 w-4 text-[#041B52] sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" aria-hidden />
          )}
        </div>
        <span
          className={cn(
            "font-bold leading-tight",
            compact ? "text-xs sm:text-sm" : "text-sm sm:text-base md:text-lg lg:text-xl"
          )}
        >
          {blocked && isStudentMeal ? "BLOCKED" : meal.label.toUpperCase()}
        </span>
        {meal.type === "ala_carte" && !compact && (
          <span className="hidden text-xs font-medium text-[#64748B] sm:block">Available Grades 9ΓÇô12</span>
        )}
      </button>
    )
  }

  return (
    <div className="scan-station-v2 flex h-full min-h-0 flex-col overflow-hidden bg-white text-[#111827]">
      <OfflineBanner
        isOffline={isOffline}
        isSyncing={isSyncing}
        syncMessage={syncMessage}
        pendingCount={pendingCount}
        staleBalanceWarning={isOffline && !!student}
      />
      <header className="flex h-[56px] shrink-0 items-center justify-between border-[1.5px] border-[#AEB6C2] border-b-[#AEB6C2]/60 bg-[#041B52] px-3 sm:h-[64px] sm:px-4 md:h-[72px] md:px-5 lg:h-[90px] lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-11 lg:w-11">
            <ScanLine className="h-4 w-4 text-white sm:h-5 sm:w-5 lg:h-6 lg:w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3">
              <StatusDot phase={scanStatus} isOffline={isOffline} />
              <p
                className={cn(
                  "text-sm font-bold tracking-wide sm:text-base md:text-lg lg:text-2xl",
                  statusColor
                )}
              >
                {statusLabel}
              </p>
              {nextScanSeconds !== null && nextScanSeconds > 0 && (
                <p className="text-xs font-semibold text-[#00A83E] sm:text-sm lg:text-base">
                  Next Scan: {nextScanSeconds.toFixed(1)}s
                </p>
              )}
            </div>
            <p className="truncate text-xs text-white/70 sm:text-sm lg:text-base">{statusSubtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          <div className="text-right text-white">
            <p className="text-base font-bold tabular-nums sm:text-lg md:text-xl lg:text-3xl">{clock}</p>
            <p className="hidden text-xs text-white/70 md:block md:text-sm">{dateStr}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-white/30 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm md:px-4 md:py-2.5"
          >
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            <span className="hidden sm:inline">MENU</span>
            <Menu className="h-3.5 w-3.5 sm:hidden" aria-hidden />
          </Link>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <section className="flex max-h-[38dvh] min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-[#AEB6C2]/60 p-2 sm:max-h-[40dvh] sm:p-3 md:max-h-none md:p-4 lg:w-[55%] lg:max-h-none lg:border-b-0 lg:border-r lg:p-6">
          {student ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3 md:gap-4">
              <div className="flex gap-2 sm:gap-3 md:gap-4">
                <Image
                  src={student.photo}
                  alt={`${student.firstName} ${student.lastName}`}
                  width={120}
                  height={120}
                  className="h-[64px] w-[64px] shrink-0 rounded-xl border border-[#AEB6C2] object-cover sm:h-[80px] sm:w-[80px] sm:rounded-2xl md:h-[100px] md:w-[100px] lg:h-[120px] lg:w-[120px]"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold uppercase tracking-tight sm:text-xl md:text-2xl lg:text-3xl">
                    {student.firstName} {student.lastName}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#64748B] sm:mt-1 sm:gap-2 sm:text-sm md:text-base lg:text-lg">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-5 md:w-5" aria-hidden />
                    Grade {student.grade}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#64748B] sm:mt-1 sm:gap-2 sm:text-sm md:text-base lg:text-lg">
                    <IdCard className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-5 md:w-5" aria-hidden />
                    ID: {student.id}
                  </p>
                </div>
              </div>

              {student.allergies.length > 0 && bannerStyle && (
                <div className="scan-allergy-alert shrink-0 rounded-xl border-2 border-[#D62828] bg-[#FEF2F2] px-3 py-2 sm:rounded-2xl sm:px-4 sm:py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-[#D62828] sm:h-5 sm:w-5" aria-hidden />
                    <p className="text-xs font-bold uppercase tracking-wide text-[#D62828] sm:text-sm">
                      Allergy Alert
                    </p>
                  </div>
                  <p className="mt-1 text-base font-bold text-[#D62828] sm:mt-2 sm:text-lg lg:text-xl">
                    {primaryAllergy || bannerStyle.label}
                  </p>
                  {mealBlocked && (
                    <p className="mt-0.5 text-xs font-semibold text-[#D62828] sm:mt-1 sm:text-sm">
                      Meal Compatibility: BLOCKED
                    </p>
                  )}
                </div>
              )}

              <div className="mt-auto shrink-0 rounded-xl border border-[#AEB6C2] bg-white p-2.5 sm:rounded-2xl sm:p-3 md:p-4 lg:p-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00A83E]/10 sm:h-9 sm:w-9 md:h-10 md:w-10">
                    <Wallet className="h-4 w-4 text-[#00A83E] sm:h-5 sm:w-5" aria-hidden />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] sm:text-xs">
                    Account Balance
                  </p>
                </div>
                <p
                  className={cn(
                    "mt-1 text-2xl font-bold tabular-nums sm:mt-2 sm:text-3xl md:text-4xl lg:text-5xl",
                    localBalance <= 0 ? "text-[#D62828]" : "text-[#00A83E]"
                  )}
                >
                  {isOffline ? "~" : ""}
                  {formatCurrency(localBalance)}
                </p>
                <Link
                  href="/parent/add-funds"
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#00A83E] py-2 text-xs font-bold text-[#00A83E] transition hover:bg-[#00A83E]/5 sm:mt-3 sm:gap-2 sm:rounded-2xl sm:py-2.5 sm:text-sm md:mt-4 md:py-3 md:text-base"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                  ADD FUNDS
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-4 text-center text-[#64748B] sm:py-6">
              <StatusDot phase={scanStatus} isOffline={isOffline} />
              <p className="mt-2 text-base font-bold text-[#041B52] sm:mt-4 sm:text-lg md:text-xl">
                Ready to scan
              </p>
              <p className="mt-1 px-4 text-xs sm:mt-2 sm:text-sm lg:text-base">
                Scan a student ID badge or enter their MD ID to begin.
              </p>
            </div>
          )}
        </section>

        <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden p-1.5 sm:p-2.5 md:p-3 lg:w-[45%] lg:shrink-0 lg:p-4">
          <p className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] sm:text-xs">
            Select Meal
          </p>

          <div className="mt-1 flex shrink-0 gap-1 sm:mt-1.5 sm:gap-1.5 md:mt-2 md:gap-2">
            {primaryMeals.map((meal) => renderMealButton(meal))}
          </div>

          {secondaryMeals.length > 0 && (
            <div className="mt-1 flex shrink-0 gap-1 sm:mt-1.5 sm:gap-1.5 md:mt-2 md:gap-2">
              {secondaryMeals.map((meal) => renderMealButton(meal, true))}
            </div>
          )}

          {studentMealAvailable && scanStatus !== "complete" && (
            <div className="mt-1 flex shrink-0 items-center gap-1.5 rounded-xl border border-[#00A83E]/40 bg-[#00A83E]/10 px-2 py-1 sm:mt-1.5 sm:gap-2 sm:rounded-2xl sm:px-2.5 sm:py-1.5 md:mt-2 md:px-3 md:py-2">
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#00A83E] sm:h-5 sm:w-5" aria-hidden />
              <p className="text-xs font-semibold text-[#00A83E] sm:text-sm">STUDENT MEAL SELECTED</p>
            </div>
          )}

          {flashMessage && (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "mt-1 shrink-0 rounded-xl border px-2 py-1.5 text-xs font-semibold sm:mt-1.5 sm:rounded-2xl sm:px-2.5 sm:py-2 sm:text-sm md:mt-2 md:px-3 md:py-2.5 md:text-base",
                flashMessage.includes("BLOCKED")
                  ? "border-[#D62828] bg-[#FEF2F2] text-[#D62828]"
                  : "border-[#00A83E] bg-[#00A83E]/10 text-[#00A83E]"
              )}
            >
              {flashMessage}
            </div>
          )}

          <div className="mt-auto min-h-0 shrink pt-0.5 sm:pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] sm:text-xs">
              Enter Student ID
            </p>
            <div className="relative mt-0.5 sm:mt-1 md:mt-1.5">
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
                className="flex h-9 items-center rounded-xl border border-[#AEB6C2] bg-[#F5F6F8] px-2.5 text-base font-bold tracking-wide text-[#111827] sm:h-10 sm:rounded-2xl sm:px-3 sm:text-lg md:h-11 md:text-xl lg:h-12 lg:text-2xl xl:h-14"
              >
                {scanValue || (
                  <span className="text-sm font-normal text-[#64748B] sm:text-base md:text-lg lg:text-xl">
                    {scanValue === "" && student ? student.id : "Enter ID"}
                  </span>
                )}
              </div>
            </div>
            <ScanKeypad
              className="mt-0.5 sm:mt-1 md:mt-1.5 lg:mt-2"
              variant="v2"
              onDigit={appendDigit}
              onBackspace={deleteLastDigit}
              onClear={clearScanValue}
              onEnter={() => lookupStudent(scanValue)}
            />
          </div>
        </section>
      </main>

      <footer className="hidden shrink-0 border-t border-[#AEB6C2] bg-white px-3 py-2 sm:block sm:px-4 md:px-5 md:py-2.5 lg:px-8 lg:py-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 lg:gap-8">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Clock className="h-3.5 w-3.5 text-[#64748B] sm:h-4 sm:w-4" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide text-[#64748B] sm:text-sm">
              Recent Activity
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-4 md:gap-x-6 md:gap-y-2">
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
