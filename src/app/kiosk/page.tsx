"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  CupSoda,
  GraduationCap,
  IdCard,
  Menu,
  Minus,
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
import { useAuth } from "@/components/providers/AuthProvider"
import { RecordOfficePayment } from "@/components/admin/RecordOfficePayment"
import { RecordStaffOfficePayment } from "@/components/admin/RecordStaffOfficePayment"
import { getAllergyBannerStyle, getHighestAllergySeverity } from "@/lib/allergy-display"
import { BarcodeCameraScanner } from "@/components/scan/BarcodeCameraScanner"
import { ScanKeypad } from "@/components/scan/ScanKeypad"
import { PosAmountKeypad } from "@/components/scan/PosAmountKeypad"
import { OfflineBanner } from "@/components/scan/OfflineBanner"
import { MEAL_PRICES } from "@/lib/types"
import type { Student, Transaction, User } from "@/lib/types"
import type { KioskPosButtonDto } from "@/lib/kiosk/pos-buttons"
import { checkMealCompatibility } from "@/lib/food-safety"
import { isPublicCalendarEvent, todayDateKey } from "@/lib/calendar-publish"
import { isPizzaDayName, PIZZA_SLICE_UNIT_PRICE } from "@/lib/pizza-day"
import { api, getSessionHeaders } from "@/lib/api/client"
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
import {
  findStaffMatchingScan,
  findStudentMatchingScan,
  sanitizeScanInput,
  transactionMatchesStudent,
} from "@/lib/scan/scan-id"
import { ROLE_LABELS, isWorkplaceUserRole } from "@/lib/users"
import { cn, formatCurrency } from "@/lib/utils"

const FLASH_DISMISS_MS = 3500

const MEAL_ICONS: Record<string, typeof Utensils> = {
  student_meal: Utensils,
  staff_meal: Users,
  ala_carte: ShoppingBag,
  milk: Wine,
  juice: CupSoda,
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
  const isCredit = (tx.type === "deposit" || tx.meal.toLowerCase().includes("fund")) && tx.amount >= 0
  const isTakeOff = tx.type === "deposit" && tx.amount < 0
  const label = isTakeOff ? "Money taken off" : isCredit ? "Added Funds" : tx.meal

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-[#64748B]">
      <span className="shrink-0 tabular-nums">{formatTxTime(tx.timestamp)}</span>
      <span className="shrink-0 text-[#AEB6C2]">|</span>
      {isCredit ? (
        <Plus className="h-3.5 w-3.5 shrink-0 text-[#041B52]" aria-hidden />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#00A83E]" aria-hidden />
      )}
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "shrink-0 font-semibold tabular-nums",
          isCredit ? "text-[#00A83E]" : "text-[#D62828]"
        )}
      >
        {isCredit
          ? `+${formatCurrency(tx.amount)}`
          : `-${formatCurrency(Math.abs(tx.amount))}`}
      </span>
    </div>
  )
}

export default function ScanStationPage() {
  const { students, transactions, processMeal, users, calendarEvents } = useDemo()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [clock, setClock] = useState(formatKioskTime())
  const [dateStr, setDateStr] = useState("")
  const [scanValue, setScanValue] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
  const [staffUser, setStaffUser] = useState<User | null>(null)
  const [localBalance, setLocalBalance] = useState(0)
  const [scanStatus, setScanStatus] = useState<ScanPhase>("ready")
  const [flashMessage, setFlashMessage] = useState("")
  const [isOffline, setIsOffline] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState("")
  const [pendingCount, setPendingCount] = useState(0)
  const [offlineRecent, setOfflineRecent] = useState<Transaction[]>([])
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [fundsAction, setFundsAction] = useState<"add" | "subtract">("add")
  const [posCents, setPosCents] = useState(0)
  const [configuredButtons, setConfiguredButtons] = useState<KioskPosButtonDto[] | null>(null)

  const scanInputRef = useRef<HTMLInputElement>(null)
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const highestSeverity = student ? getHighestAllergySeverity(student.allergies) : null
  const bannerStyle = highestSeverity ? getAllergyBannerStyle(highestSeverity) : null
  const mealCompatibility = student ? checkMealCompatibility(student) : null
  const mealBlocked = mealCompatibility === "BLOCKED"
  const primaryAllergy = student?.allergies[0]?.name.toUpperCase() ?? ""
  const dinerActive = Boolean(student || staffUser)
  const cashierCanSellAlaCarte = user?.role === "cashier" || user?.role === "admin"
  const workplaceUsers = useMemo(
    () => users.filter((u) => isWorkplaceUserRole(u.role) && u.status === "active"),
    [users]
  )

  useEffect(() => {
    let cancelled = false
    async function loadButtons() {
      try {
        const res = await fetch("/api/kiosk/pos-buttons", { headers: { ...getSessionHeaders() } })
        if (!res.ok) return
        const data = (await res.json()) as { buttons: KioskPosButtonDto[] }
        if (!cancelled && Array.isArray(data.buttons)) {
          setConfiguredButtons(data.buttons)
        }
      } catch {
        // Fall back to MEAL_PRICES below
      }
    }
    void loadButtons()
    return () => {
      cancelled = true
    }
  }, [])

  const recentTransactions = useMemo(() => {
    const source =
      isOffline && offlineRecent.length > 0
        ? offlineRecent
        : [...transactions].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
    if (student) {
      return source.filter((tx) => transactionMatchesStudent(tx, student)).slice(0, 3)
    }
    if (staffUser) {
      return []
    }
    return source.slice(0, 3)
  }, [transactions, isOffline, offlineRecent, student, staffUser])

  const kioskMeals = useMemo(() => {
    const today = todayDateKey()
    const todayMenu = calendarEvents.find(
      (e) => e.date === today && e.category === "menu_day" && isPublicCalendarEvent(e)
    )
    const pizzaDay = isPizzaDayName(todayMenu?.title)

    if (configuredButtons && configuredButtons.length > 0) {
      return configuredButtons.map((button) => ({
        type: button.key,
        label: button.label,
        price:
          pizzaDay && (button.key === "student_meal" || button.key === "staff_meal")
            ? PIZZA_SLICE_UNIT_PRICE
            : button.price,
        grades: button.grades.length > 0 ? button.grades : undefined,
        audience: button.audience,
        category: button.category,
        isSystem: button.isSystem,
      }))
    }

    return MEAL_PRICES.map((meal) => ({
      ...meal,
      audience:
        meal.type === "student_meal"
          ? ("STUDENT" as const)
          : meal.type === "staff_meal"
            ? ("STAFF" as const)
            : meal.type === "ala_carte"
              ? ("CASHIER_ONLY" as const)
              : ("BOTH" as const),
      category:
        meal.type === "milk" || meal.type === "juice"
          ? ("DRINK" as const)
          : meal.type === "ala_carte"
            ? ("ALA_CARTE" as const)
            : ("MEAL" as const),
      isSystem: meal.type === "student_meal" || meal.type === "staff_meal",
      price:
        pizzaDay && (meal.type === "student_meal" || meal.type === "staff_meal")
          ? PIZZA_SLICE_UNIT_PRICE
          : meal.price,
    }))
  }, [calendarEvents, configuredButtons])

  function buttonVisibleForDiner(meal: (typeof kioskMeals)[number]) {
    const audience = meal.audience
    if (staffUser) {
      return audience === "STAFF" || audience === "BOTH"
    }
    if (student) {
      if (audience === "STAFF") return false
      if (audience === "CASHIER_ONLY") return cashierCanSellAlaCarte
      return audience === "STUDENT" || audience === "BOTH" || audience === "CASHIER_ONLY"
    }
    return false
  }

  const visibleMeals = kioskMeals.filter(buttonVisibleForDiner)
  const primaryRow = visibleMeals.filter((m) => m.type === "student_meal")
  const staffRow = visibleMeals.filter((m) => m.type === "staff_meal")
  const cashierOnlyRow = visibleMeals.filter((m) => m.audience === "CASHIER_ONLY")
  const drinkRow = visibleMeals.filter(
    (m) => m.category === "DRINK" || m.type === "milk" || m.type === "juice"
  )
  const customRow = visibleMeals.filter(
    (m) =>
      m.type !== "student_meal" &&
      m.type !== "staff_meal" &&
      m.audience !== "CASHIER_ONLY" &&
      m.category !== "DRINK" &&
      m.type !== "milk" &&
      m.type !== "juice"
  )

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
      if (!keepStudent) {
        setStudent(null)
        setStaffUser(null)
        setAddFundsOpen(false)
        setPosCents(0)
      }
      setScanStatus(keepStudent ? "found" : "ready")
      setScanValue("")
      window.setTimeout(focusScan, 50)
    },
    [focusScan]
  )

  useEffect(() => {
    if (addFundsOpen) return
    focusScan()
    const interval = setInterval(focusScan, 2000)
    return () => clearInterval(interval)
  }, [focusScan, addFundsOpen])

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
    if (!flashMessage || scanStatus === "error") return
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlashMessage(""), FLASH_DISMISS_MS)
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [flashMessage, scanStatus])

  const loadStudent = useCallback(
    (found: Student) => {
      if (found.disabled) {
        setScanStatus("error")
        setFlashMessage("Student account is disabled.")
        setScanValue("")
        window.setTimeout(focusScan, 50)
        return
      }
      if (found.badgeStatus === "inactive") {
        setScanStatus("error")
        setFlashMessage("Badge deactivated.")
        setScanValue("")
        window.setTimeout(focusScan, 50)
        return
      }
      if (found.badgeStatus === "pending") {
        setScanStatus("error")
        setFlashMessage("Badge not yet activated.")
        setScanValue("")
        window.setTimeout(focusScan, 50)
        return
      }
      setStaffUser(null)
      setStudent(found)
      setLocalBalance(found.balance)
      setScanStatus("found")
      setScanValue("")
      setFlashMessage("")
      setAddFundsOpen(false)
      setPosCents(0)
      window.setTimeout(focusScan, 50)
    },
    [focusScan]
  )

  const loadStaff = useCallback(
    (found: User) => {
      if (found.status !== "active") {
        setScanStatus("error")
        setFlashMessage("Staff account is disabled.")
        setScanValue("")
        window.setTimeout(focusScan, 50)
        return
      }
      if (!found.badgeId?.trim()) {
        setScanStatus("error")
        setFlashMessage("No badge ID on this staff account.")
        setScanValue("")
        window.setTimeout(focusScan, 50)
        return
      }
      setStudent(null)
      setStaffUser(found)
      setLocalBalance(found.accountBalance ?? 0)
      setScanStatus("found")
      setScanValue("")
      setFlashMessage("")
      setAddFundsOpen(false)
      setPosCents(0)
      window.setTimeout(focusScan, 50)
    },
    [focusScan]
  )

  const lookupStudent = useCallback(
    async (id: string) => {
      const trimmed = sanitizeScanInput(id)
      if (!trimmed) return

      // Stay on the kiosk station for miss/hit — never clear auth/session on scan miss.
      if (isOffline) {
        const cached = await findCachedStudent(trimmed)
        if (!cached) {
          setScanStatus("error")
          setFlashMessage("Not found offline. Student badges only while offline — try again online for staff.")
          setScanValue("")
          window.setTimeout(focusScan, 50)
          return
        }
        loadStudent(cachedToStudent(cached))
        return
      }

      const found = findStudentMatchingScan(students, trimmed)
      if (found) {
        loadStudent(found)
        return
      }

      const staffLocal = findStaffMatchingScan(workplaceUsers, trimmed)
      if (staffLocal) {
        loadStaff(staffLocal)
        return
      }

      const cached = await findCachedStudent(trimmed)
      if (cached) {
        loadStudent(cachedToStudent(cached))
        return
      }

      // Server-side fallback covers stale client lists and alternate barcode formats.
      try {
        const res = await fetch(`/api/students/lookup?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const remote = (await res.json()) as Student
          if (remote?.id) {
            loadStudent(remote)
            return
          }
        }
      } catch {
        // Keep kiosk online UX; fall through to staff lookup.
      }

      try {
        const res = await fetch(`/api/users/lookup?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const remote = (await res.json()) as User
          if (remote?.id) {
            loadStaff(remote)
            return
          }
        }
      } catch {
        // Fall through to not-found message.
      }

      setScanStatus("error")
      setFlashMessage("Badge not found. Check student MD ID / barcode or staff badge ID.")
      setScanValue("")
      window.setTimeout(focusScan, 50)
    },
    [students, workplaceUsers, loadStudent, loadStaff, focusScan, isOffline]
  )

  function handleScanChange(value: string) {
    const cleaned = sanitizeScanInput(value)
    setScanValue(cleaned)
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
    if (cleaned.length >= 4) {
      setScanStatus("scanning")
      scanTimerRef.current = setTimeout(() => lookupStudent(cleaned), 200)
    } else if (cleaned.length === 0) {
      setScanStatus(dinerActive ? "found" : "ready")
    }
  }

  function appendDigit(digit: string) {
    handleScanChange(scanValue + digit)
  }

  function deleteLastDigit() {
    handleScanChange(scanValue.slice(0, -1))
  }

  function clearScanValue() {
    setScanValue("")
    setScanStatus(dinerActive ? "found" : "ready")
    window.setTimeout(focusScan, 50)
  }

  function goBackToKeypad() {
    setFlashMessage("")
    armScanner()
  }

  async function handleMeal(mealLabel: string, price: number, mealType?: string) {
    if (mealType === "staff_meal" && !staffUser) {
      return
    }

    if (staffUser) {
      if (isOffline) {
        setFlashMessage("Staff meals need an online connection. Try again when the network is back.")
        window.setTimeout(focusScan, 50)
        return
      }
      try {
        const result = await api.processStaffMeal(
          staffUser.id,
          mealLabel,
          price,
          undefined,
          mealType
        )
        setLocalBalance(result.balanceAfter)
        setStaffUser((prev) =>
          prev ? { ...prev, accountBalance: result.balanceAfter } : prev
        )
        setFlashMessage(`${mealLabel} recorded for ${staffUser.firstName}!`)
        setScanStatus("found")
        void queryClient.invalidateQueries({ queryKey: ["users"] })
        window.setTimeout(focusScan, 50)
      } catch (error) {
        setFlashMessage(
          error instanceof Error ? error.message : "Could not charge staff lunch account."
        )
        window.setTimeout(focusScan, 50)
      }
      return
    }

    if (!student) return
    const isStudentLunch = mealType === "student_meal"
    if (mealBlocked && isStudentLunch) {
      setFlashMessage("MEAL BLOCKED — Allergy conflict. Do not serve today's meal.")
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
      setScanStatus("found")
      window.setTimeout(focusScan, 50)
    }

    if (isOffline) {
      await recordOfflineMeal()
      return
    }

    const tx = await processMeal(student.id, mealLabel, price, undefined, mealType)
    if (tx) {
      setLocalBalance(tx.balanceAfter)
      setFlashMessage(`${mealLabel} recorded for ${student.firstName}!`)
      setScanStatus("found")
      window.setTimeout(focusScan, 50)
      return
    }

    setIsOffline(true)
    await recordOfflineMeal()
  }

  async function handlePosCharge(amount: number) {
    if (!dinerActive || amount <= 0) return
    await handleMeal("Item", amount, "pos_item")
    setPosCents(0)
  }

  const statusLabel =
    scanStatus === "scanning"
      ? "PROCESSING"
      : scanStatus === "complete"
        ? "COMPLETE"
        : scanStatus === "error"
          ? "NOT FOUND"
          : dinerActive
            ? "READY"
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
      ? "Reading badge — hold still"
      : scanStatus === "error"
        ? "Badge not recognized — tap Back to try the next student"
        : scanStatus === "complete"
          ? flashMessage || "Transaction recorded"
          : dinerActive
            ? "Tap Back when you are ready for the next student"
            : "Point camera at badge barcode, or enter ID"

  const studentMealAvailable =
    student && !mealBlocked && primaryRow.find((m) => m.type === "student_meal")
  const staffMealAvailable = staffUser && staffRow.find((m) => m.type === "staff_meal")

  function renderMealButton(
    meal: (typeof kioskMeals)[number],
    compact = false
  ) {
    const Icon = MEAL_ICONS[meal.type] ?? Utensils
    const gradeRestricted = meal.grades && student && !meal.grades.includes(student.grade)
    const blocked = Boolean(
      student &&
        mealBlocked &&
        (meal.type === "student_meal" || meal.type === "staff_meal")
    )
    const noDiner = !student && !staffUser
    const disabled = noDiner || !!gradeRestricted || blocked
    const isStudentMeal = meal.type === "student_meal"
    const isStaffMeal = meal.type === "staff_meal"
    if (isStaffMeal && !staffUser) return null
    const isSelected =
      (!!student && isStudentMeal && !disabled && scanStatus !== "complete") ||
      (!!staffUser && isStaffMeal && !disabled && scanStatus !== "complete")

    if (meal.audience === "CASHIER_ONLY" && !cashierCanSellAlaCarte) return null
    if (gradeRestricted && meal.audience === "CASHIER_ONLY" && !cashierCanSellAlaCarte) return null

    return (
      <button
        key={meal.type}
        type="button"
        disabled={disabled}
        onClick={() => handleMeal(meal.label, meal.price, meal.type)}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-2xl",
          compact
            ? "min-h-[40px] gap-0.5 px-2 py-1.5 sm:min-h-[47px] sm:gap-1 sm:px-2.5 sm:py-2 md:min-h-[50px] lg:min-h-[58px]"
            : "min-h-[65px] flex-1 gap-1 px-2 py-2.5 sm:min-h-[79px] sm:gap-1 sm:px-3 sm:py-3 md:min-h-[90px] lg:min-h-[108px] lg:gap-1.5 lg:px-3 lg:py-4 xl:min-h-[126px]",
          isSelected
            ? "border-[#00A83E] bg-[#00A83E] text-white"
            : meal.audience === "CASHIER_ONLY" || meal.category === "ALA_CARTE"
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
          {(meal.category === "ALA_CARTE" || meal.type === "ala_carte") && !compact && (
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
        {!blocked && (
          <span
            className={cn(
              "font-semibold tabular-nums",
              compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm",
              isSelected ? "text-white/90" : "text-[#64748B]"
            )}
          >
            {formatCurrency(meal.price)}
          </span>
        )}
        {(meal.category === "ALA_CARTE" || meal.type === "ala_carte") &&
          meal.grades &&
          meal.grades.length > 0 &&
          !compact && (
            <span className="hidden text-xs font-medium text-[#64748B] sm:block">
              Available Grades {meal.grades[0]}–{meal.grades[meal.grades.length - 1]}
            </span>
          )}
      </button>
    )
  }

  return (
    <div className="scan-station-v2 flex min-h-0 w-full flex-1 flex-col overflow-x-hidden bg-white text-[#111827] lg:h-full lg:overflow-hidden">
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
            </div>
            <p className="truncate text-xs text-white/70 sm:text-sm lg:text-base">{statusSubtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {(dinerActive || scanStatus === "error") && (
            <button
              type="button"
              onClick={goBackToKeypad}
              className="flex items-center gap-1.5 rounded-xl border border-white bg-white px-3 py-2 text-sm font-bold text-[#041B52] transition hover:bg-white/90 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base md:text-lg"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              Back
              <span className="hidden font-semibold text-[#64748B] sm:inline">· Next student</span>
            </button>
          )}
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

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <section className="flex min-h-0 w-full shrink-0 flex-col overflow-x-hidden overflow-y-auto border-b border-[#AEB6C2]/60 p-2 sm:p-3 md:p-4 lg:h-full lg:w-[55%] lg:flex-1 lg:border-b-0 lg:border-r lg:p-6">
          {student ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3 md:gap-4">
              <div className="flex gap-2 sm:gap-3 md:gap-4">
                <Image
                  src={student.photo}
                  alt={`${student.firstName} ${student.lastName}`}
                  width={120}
                  height={120}
                  className="h-[64px] w-[64px] shrink-0 rounded-xl border border-[#AEB6C2] object-cover sm:h-[80px] sm:w-[80px] sm:rounded-2xl md:h-[100px] md:w-[100px] lg:h-[120px] lg:w-[120px]"
                  unoptimized={student.photo.startsWith("data:")}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold uppercase tracking-tight sm:text-xl md:text-2xl lg:text-3xl">
                    {student.firstName} {student.lastName}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#64748B] sm:mt-1 sm:gap-2 sm:text-sm md:text-base lg:text-lg">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-5 md:w-5" aria-hidden />
                    Grade {student.grade}
                  </p>
                  <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#64748B] sm:mt-1 sm:gap-x-2 sm:text-sm md:text-base lg:text-lg">
                    <IdCard className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-5 md:w-5" aria-hidden />
                    <span className="min-w-0 break-all">MD ID: {student.id}</span>
                    {student.barcode && student.barcode !== student.id ? (
                      <span className="min-w-0 break-all text-[#64748B]">
                        · Barcode: {student.barcode}
                      </span>
                    ) : null}
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
                <div className="mt-2 flex flex-col gap-2 sm:mt-3 md:mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFundsAction("add")
                      setAddFundsOpen(true)
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#00A83E] py-2 text-xs font-bold text-[#00A83E] transition hover:bg-[#00A83E]/5 sm:gap-2 sm:rounded-2xl sm:py-2.5 sm:text-sm md:py-3 md:text-base"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                    ADD MONEY
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFundsAction("subtract")
                      setAddFundsOpen(true)
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#041B52] py-2 text-xs font-bold text-[#041B52] transition hover:bg-[#041B52]/5 sm:gap-2 sm:rounded-2xl sm:py-2.5 sm:text-sm md:py-3 md:text-base"
                  >
                    <Minus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                    TAKE MONEY OFF
                  </button>
                </div>
              </div>
            </div>
          ) : staffUser ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3 md:gap-4">
              <div className="flex gap-2 sm:gap-3 md:gap-4">
                {staffUser.photo ? (
                  <Image
                    src={staffUser.photo}
                    alt={`${staffUser.firstName} ${staffUser.lastName}`}
                    width={120}
                    height={120}
                    className="h-[64px] w-[64px] shrink-0 rounded-xl border border-[#AEB6C2] object-cover sm:h-[80px] sm:w-[80px] sm:rounded-2xl md:h-[100px] md:w-[100px] lg:h-[120px] lg:w-[120px]"
                    unoptimized={staffUser.photo.startsWith("data:")}
                  />
                ) : (
                  <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-xl border border-[#AEB6C2] bg-[#F5F6F8] text-lg font-bold text-[#041B52] sm:h-[80px] sm:w-[80px] sm:rounded-2xl md:h-[100px] md:w-[100px] lg:h-[120px] lg:w-[120px]">
                    {(staffUser.firstName[0] ?? "") + (staffUser.lastName[0] ?? "")}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold uppercase tracking-tight sm:text-xl md:text-2xl lg:text-3xl">
                    {staffUser.firstName} {staffUser.lastName}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#64748B] sm:mt-1 sm:gap-2 sm:text-sm md:text-base lg:text-lg">
                    <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-5 md:w-5" aria-hidden />
                    {ROLE_LABELS[staffUser.role]}
                    {staffUser.department ? ` · ${staffUser.department}` : ""}
                  </p>
                  <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#64748B] sm:mt-1 sm:gap-x-2 sm:text-sm md:text-base lg:text-lg">
                    <IdCard className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-5 md:w-5" aria-hidden />
                    <span className="min-w-0 break-all">Badge ID: {staffUser.badgeId}</span>
                  </p>
                </div>
              </div>

              <div className="mt-auto shrink-0 rounded-xl border border-[#AEB6C2] bg-white p-2.5 sm:rounded-2xl sm:p-3 md:p-4 lg:p-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00A83E]/10 sm:h-9 sm:w-9 md:h-10 md:w-10">
                    <Wallet className="h-4 w-4 text-[#00A83E] sm:h-5 sm:w-5" aria-hidden />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] sm:text-xs">
                    Staff Lunch Balance
                  </p>
                </div>
                <p
                  className={cn(
                    "mt-1 text-2xl font-bold tabular-nums sm:mt-2 sm:text-3xl md:text-4xl lg:text-5xl",
                    localBalance <= 0 ? "text-[#D62828]" : "text-[#00A83E]"
                  )}
                >
                  {formatCurrency(localBalance)}
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:mt-3 md:mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFundsAction("add")
                      setAddFundsOpen(true)
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#00A83E] py-2 text-xs font-bold text-[#00A83E] transition hover:bg-[#00A83E]/5 sm:gap-2 sm:rounded-2xl sm:py-2.5 sm:text-sm md:py-3 md:text-base"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                    ADD MONEY
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFundsAction("subtract")
                      setAddFundsOpen(true)
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#041B52] py-2 text-xs font-bold text-[#041B52] transition hover:bg-[#041B52]/5 sm:gap-2 sm:rounded-2xl sm:py-2.5 sm:text-sm md:py-3 md:text-base"
                  >
                    <Minus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                    TAKE MONEY OFF
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <StatusDot phase={scanStatus} isOffline={isOffline} />
                <div className="min-w-0">
                  <p className="text-base font-bold text-[#041B52] sm:text-lg md:text-xl">
                    Ready to scan
                  </p>
                  <p className="text-xs text-[#64748B] sm:text-sm">
                    Point camera at a student or staff badge, use a USB scanner, or enter the ID.
                  </p>
                </div>
              </div>
              <BarcodeCameraScanner
                className="min-h-0 flex-1"
                defaultOpen
                paused={scanStatus === "scanning" || scanStatus === "complete"}
                onDetect={(raw) => {
                  setScanStatus("scanning")
                  void lookupStudent(raw)
                }}
              />
            </div>
          )}
        </section>

        <section className="flex min-h-0 w-full shrink-0 flex-col overflow-x-hidden overflow-y-auto p-1.5 sm:p-2.5 md:p-3 lg:h-full lg:w-[45%] lg:flex-1 lg:p-4">
          <p className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] sm:text-xs">
            Select lunch
          </p>

          <div className="mobile-scroll-x mt-1 flex shrink-0 gap-1 pb-0.5 sm:mt-1.5 sm:gap-1.5 md:mt-2 md:gap-2 md:overflow-visible">
            {primaryRow.map((meal) => renderMealButton(meal))}
            {customRow
              .filter((m) => m.category === "MEAL")
              .map((meal) => renderMealButton(meal))}
          </div>

          {cashierCanSellAlaCarte && cashierOnlyRow.length > 0 && student ? (
            <div className="mt-1.5 shrink-0 rounded-xl border border-[#041B52]/20 bg-[#F7F8FB] p-2 sm:mt-2 sm:p-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] sm:text-xs">
                Cashier only — a la carte
              </p>
              <div className="flex flex-col gap-1.5">
                {cashierOnlyRow.map((meal) => renderMealButton(meal, true))}
              </div>
            </div>
          ) : null}

          {staffRow.length > 0 && (
            <div className="mobile-scroll-x mt-1 flex shrink-0 gap-1 pb-0.5 sm:mt-1.5 sm:gap-1.5 md:mt-2 md:gap-2 md:overflow-visible">
              {staffRow.map((meal) => renderMealButton(meal, true))}
            </div>
          )}

          {drinkRow.length > 0 && (
            <div className="mobile-scroll-x mt-1 flex shrink-0 gap-1 pb-0.5 sm:mt-1.5 sm:gap-1.5 md:mt-2 md:gap-2 md:overflow-visible">
              {drinkRow.map((meal) => renderMealButton(meal, true))}
            </div>
          )}

          {customRow.filter((m) => m.category !== "MEAL").length > 0 && (
            <div className="mobile-scroll-x mt-1 flex shrink-0 gap-1 pb-0.5 sm:mt-1.5 sm:gap-1.5 md:mt-2 md:gap-2 md:overflow-visible">
              {customRow
                .filter((m) => m.category !== "MEAL")
                .map((meal) => renderMealButton(meal, true))}
            </div>
          )}

          {studentMealAvailable && scanStatus !== "complete" && (
            <div className="mt-1 flex shrink-0 items-center gap-1.5 rounded-xl border border-[#00A83E]/40 bg-[#00A83E]/10 px-2 py-1 sm:mt-1.5 sm:gap-2 sm:rounded-2xl sm:px-2.5 sm:py-1.5 md:mt-2 md:px-3 md:py-2">
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#00A83E] sm:h-5 sm:w-5" aria-hidden />
              <p className="text-xs font-semibold text-[#00A83E] sm:text-sm">STUDENT MEAL SELECTED</p>
            </div>
          )}

          {staffMealAvailable && scanStatus !== "complete" && (
            <div className="mt-1 flex shrink-0 items-center gap-1.5 rounded-xl border border-[#00A83E]/40 bg-[#00A83E]/10 px-2 py-1 sm:mt-1.5 sm:gap-2 sm:rounded-2xl sm:px-2.5 sm:py-1.5 md:mt-2 md:px-3 md:py-2">
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#00A83E] sm:h-5 sm:w-5" aria-hidden />
              <p className="text-xs font-semibold text-[#00A83E] sm:text-sm">STAFF MEAL READY</p>
            </div>
          )}

          {flashMessage && (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "mt-1 shrink-0 rounded-xl border px-2 py-1.5 text-xs font-semibold sm:mt-1.5 sm:rounded-2xl sm:px-2.5 sm:py-2 sm:text-sm md:mt-2 md:px-3 md:py-2.5 md:text-base",
                scanStatus === "error" ||
                flashMessage.includes("BLOCKED") ||
                flashMessage.toLowerCase().includes("not found")
                  ? "border-[#D62828] bg-[#FEF2F2] text-[#D62828]"
                  : "border-[#00A83E] bg-[#00A83E]/10 text-[#00A83E]"
              )}
            >
              {flashMessage}
            </div>
          )}

          <div className="mt-2 min-h-0 shrink-0 pt-0.5 sm:mt-auto sm:pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] sm:text-xs">
              {dinerActive ? "Type price — then Charge" : "Enter Badge / Student ID"}
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
                aria-label="Badge ID scanner input"
              />
              <div
                role="textbox"
                aria-readonly="true"
                aria-labelledby="badge-input"
                className="flex h-9 items-center rounded-xl border border-[#AEB6C2] bg-[#F5F6F8] px-2.5 text-base font-bold tracking-wide text-[#111827] sm:h-10 sm:rounded-2xl sm:px-3 sm:text-lg md:h-11 md:text-xl lg:h-12 lg:text-2xl xl:h-14"
              >
                {dinerActive ? (
                  <span className="tabular-nums">{formatCurrency(posCents / 100)}</span>
                ) : scanValue ? (
                  scanValue
                ) : (
                  <span className="text-sm font-normal text-[#64748B] sm:text-base md:text-lg lg:text-xl">
                    Enter ID
                  </span>
                )}
              </div>
            </div>
            {dinerActive ? (
              <PosAmountKeypad
                className="mt-0.5 sm:mt-1 md:mt-1.5 lg:mt-2"
                cents={posCents}
                onCentsChange={setPosCents}
                onCharge={(amount) => {
                  void handlePosCharge(amount)
                }}
              />
            ) : (
              <ScanKeypad
                className="mt-0.5 sm:mt-1 md:mt-1.5 lg:mt-2"
                variant="v2"
                onDigit={appendDigit}
                onBackspace={deleteLastDigit}
                onClear={clearScanValue}
                onEnter={() => lookupStudent(scanValue)}
              />
            )}
          </div>
        </section>
      </main>

      <footer className="hidden shrink-0 border-t border-[#AEB6C2] bg-white px-3 py-2 sm:block sm:px-4 md:px-5 md:py-2.5 lg:px-8 lg:py-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 lg:gap-8">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Clock className="h-3.5 w-3.5 text-[#64748B] sm:h-4 sm:w-4" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide text-[#64748B] sm:text-sm">
              {student ? "Recent Activity" : "Station"}
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
              <p className="text-sm text-[#64748B]">
                {student
                  ? `No activity yet for ${student.firstName}`
                  : "No recent transactions"}
              </p>
            )}
          </div>
          <div className="hidden items-center gap-2 text-xs text-[#64748B] lg:flex">
            <CreditCard className="h-3.5 w-3.5" aria-hidden />
            <span>{student ? student.id : "Station"}</span>
          </div>
        </div>
      </footer>

      {addFundsOpen && student && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={fundsAction === "subtract" ? "Take money off account" : "Add money to account"}
        >
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#041B52]">
                  {fundsAction === "subtract" ? "Take money off" : "Add money"}
                </h2>
                <p className="text-sm text-[#64748B]">
                  {fundsAction === "subtract"
                    ? `Correction or refund for ${student.firstName} ${student.lastName}. This is not a lunch charge.`
                    : `Office deposit for ${student.firstName} ${student.lastName}. Tap Back when you are ready for the next student.`}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-[#AEB6C2] px-3 py-2 text-sm font-semibold text-[#041B52]"
                onClick={() => {
                  setAddFundsOpen(false)
                }}
              >
                Close
              </button>
            </div>
            <RecordOfficePayment
              key={`${student.id}-${fundsAction}`}
              students={[student]}
              initialStudentId={student.id}
              initialAction={fundsAction}
              compact
              onDone={(balanceAfter) => {
                setLocalBalance(balanceAfter)
                setStudent((prev) => (prev ? { ...prev, balance: balanceAfter } : prev))
                void queryClient.invalidateQueries({ queryKey: ["students"] })
                void queryClient.invalidateQueries({ queryKey: ["transactions"] })
              }}
            />
          </div>
        </div>
      )}

      {addFundsOpen && staffUser && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={fundsAction === "subtract" ? "Take money off staff account" : "Add money to staff account"}
        >
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#041B52]">
                  {fundsAction === "subtract" ? "Take money off" : "Add money"}
                </h2>
                <p className="text-sm text-[#64748B]">
                  {fundsAction === "subtract"
                    ? `Correction or refund for ${staffUser.firstName} ${staffUser.lastName}. This is not a lunch charge.`
                    : `Office deposit for ${staffUser.firstName} ${staffUser.lastName}. Tap Back when you are ready for the next student.`}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-[#AEB6C2] px-3 py-2 text-sm font-semibold text-[#041B52]"
                onClick={() => {
                  setAddFundsOpen(false)
                }}
              >
                Close
              </button>
            </div>
            <RecordStaffOfficePayment
              key={`${staffUser.id}-${fundsAction}`}
              staffUser={staffUser}
              initialAction={fundsAction}
              onDone={(balanceAfter) => {
                setLocalBalance(balanceAfter)
                setStaffUser((prev) =>
                  prev ? { ...prev, accountBalance: balanceAfter } : prev
                )
                void queryClient.invalidateQueries({ queryKey: ["users"] })
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
