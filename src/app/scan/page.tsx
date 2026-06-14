"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AlertTriangle, ScanLine, ShoppingCart, Utensils, Users, Wine } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { getAllergyBannerStyle, getHighestAllergySeverity } from "@/data/demo"
import { ScanKeypad } from "@/components/scan/ScanKeypad"
import { Label } from "@/components/ui/input"
import { MEAL_PRICES } from "@/lib/types"
import type { Student } from "@/lib/types"
import { checkMealCompatibility, formatDaysAgo } from "@/lib/food-safety"
import { cn, formatCurrency, formatTime } from "@/lib/utils"

const MEAL_RESET_MS = 1200
const ERROR_RESET_MS = 2000
const FLASH_DISMISS_MS = 2000

const MEAL_STYLES: Record<string, { bg: string; icon: typeof Utensils }> = {
  student_meal: { bg: "bg-[#0D7A3B] hover:bg-[#0a6632]", icon: Utensils },
  staff_meal: { bg: "bg-[#0B2D8F] hover:bg-[#092575]", icon: Users },
  ala_carte: { bg: "bg-[#A85609] hover:bg-[#924a08]", icon: ShoppingCart },
  milk: { bg: "bg-[#64748B] hover:bg-[#556275]", icon: Wine },
}

export default function ScanStationPage() {
  const { user: authUser } = useAuth()
  const { students, users, processMeal, getStudentProfile } = useDemo()
  const [clock, setClock] = useState(formatTime())
  const [dateStr, setDateStr] = useState("")
  const [scanValue, setScanValue] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
  const [localBalance, setLocalBalance] = useState(0)
  const [scanStatus, setScanStatus] = useState<"ready" | "scanning" | "found" | "error">("ready")
  const [flashMessage, setFlashMessage] = useState("")

  const scanInputRef = useRef<HTMLInputElement>(null)
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const profile = student ? getStudentProfile(student.id) : undefined
  const highestSeverity = student ? getHighestAllergySeverity(student.allergies) : null
  const bannerStyle = highestSeverity ? getAllergyBannerStyle(highestSeverity) : null
  const mealCompatibility = student ? checkMealCompatibility(student) : null
  const mealBlocked = mealCompatibility === "BLOCKED"
  const allergyNames = useMemo(
    () => student?.allergies.map((a) => a.name.toUpperCase()).join(" + ") ?? "",
    [student]
  )

  const activeCashier = useMemo(() => {
    if (!authUser || authUser.role !== "cashier") return null
    return users.find((u) => u.id === authUser.id) ?? null
  }, [authUser, users])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(formatTime(now))
      setDateStr(now.toLocaleDateString("en-US"))
    }
    tick()
    const timer = setInterval(tick, 1000)
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
      if (!keepStudent) setStudent(null)
      setScanStatus(keepStudent ? "found" : "ready")
      setScanValue("")
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
    const tx = await processMeal(
      student.id,
      mealLabel,
      price,
      activeCashier?.id
    )
    if (tx) {
      setLocalBalance(tx.balanceAfter)
      setFlashMessage(`${mealLabel} recorded for ${student.firstName}!`)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      resetTimerRef.current = setTimeout(resetStation, MEAL_RESET_MS)
      window.setTimeout(focusScan, 50)
    }
  }

  const scannerArmed = scanStatus === "ready" || scanStatus === "found"
  const statusLabel =
    scanStatus === "scanning"
      ? "SCANNING..."
      : scanStatus === "error"
        ? "NOT FOUND"
        : "READY TO SCAN"

  const statusHint =
    scanStatus === "scanning"
      ? "Reading badge — hold still"
      : scanStatus === "error"
        ? "Badge not recognized — scanner will re-arm automatically"
        : student
          ? `${student.firstName} loaded — select meal or scan next badge`
          : "Walk up, scan badge, and go"

  return (
    <div className="p-4 lg:p-6">
      {student && student.allergies.length > 0 && bannerStyle && (
        <div
          className={cn(
            "-mx-4 mb-6 border-y-4 px-6 py-8 text-center lg:-mx-6",
            highestSeverity === "severe" && "border-red-600 bg-red-600 text-white animate-pulse",
            highestSeverity === "moderate" && "border-yellow-500 bg-yellow-500 text-white",
            highestSeverity === "informational" && "border-blue-600 bg-blue-600 text-white"
          )}
        >
          <p className="text-4xl font-black tracking-wider md:text-5xl lg:text-6xl">
            {bannerStyle.label}
          </p>
          <p className="mt-4 text-3xl font-bold md:text-4xl">{allergyNames}</p>
          <p className="mt-3 text-xl font-semibold opacity-90">
            Last Verified: {formatDaysAgo(profile?.allergyReviewedAt)}
          </p>
          <p
            className={cn(
              "mt-4 inline-block rounded-xl px-6 py-3 text-2xl font-black md:text-3xl",
              mealCompatibility === "BLOCKED" ? "bg-white text-red-600" : "bg-white/20"
            )}
          >
            Meal Compatibility: {mealCompatibility}
          </p>
        </div>
      )}

      <div className="mx-auto max-w-[1600px] space-y-6">
        <div
          className={cn(
            "rounded-2xl border-2 px-6 py-4",
            activeCashier
              ? "border-[#0D7A3B]/30 bg-green-50"
              : "border-amber-400/50 bg-amber-50"
          )}
        >
          {activeCashier ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#0D7A3B]">
                  Cashier on duty
                </p>
                <p className="text-2xl font-bold text-[#001E62]">
                  {activeCashier.firstName} {activeCashier.lastName}
                </p>
              </div>
              {activeCashier.badgeId && (
                <div className="rounded-xl bg-white px-5 py-3 text-center">
                  <p className="text-xs font-medium text-[#64748B]">Staff Badge</p>
                  <p className="font-mono text-2xl font-bold text-[#001E62]">{activeCashier.badgeId}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-lg font-semibold text-amber-900">
              No cashier signed in — meal scans will not be linked to a staff member.{" "}
              <Link href="/login/cashier" className="underline">
                Sign in at shift start
              </Link>
            </p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div
            className={cn(
              "flex items-center gap-5 rounded-2xl border-4 px-6 py-6",
              scanStatus === "error"
                ? "border-red-500 bg-red-50"
                : scanStatus === "scanning"
                  ? "border-[#001E62]/40 bg-white"
                  : "border-[#001E62] bg-[#001E62] text-white"
            )}
          >
            {scannerArmed ? (
              <span
                className="relative flex h-8 w-8 shrink-0 items-center justify-center"
                aria-hidden
              >
                <span className="scan-ready-ring absolute inline-flex h-8 w-8 rounded-full bg-red-500" />
                <span className="scan-ready-dot relative inline-flex h-5 w-5 rounded-full bg-red-600 ring-4 ring-red-600/30" />
              </span>
            ) : scanStatus === "scanning" ? (
              <ScanLine className="h-12 w-12 shrink-0 animate-pulse text-[#001E62]" />
            ) : (
              <ScanLine className="h-12 w-12 shrink-0 text-red-500" />
            )}
            <div className="flex-1">
              <p
                className={cn(
                  "text-4xl font-black tracking-wide md:text-5xl",
                  scanStatus === "error"
                    ? "text-red-600"
                    : scanStatus === "scanning"
                      ? "text-[#001E62]"
                      : "text-white"
                )}
              >
                {statusLabel}
              </p>
              <p
                className={cn(
                  "mt-1 text-xl font-semibold md:text-2xl",
                  scanStatus === "error"
                    ? "text-red-500"
                    : scanStatus === "scanning"
                      ? "text-[#64748B]"
                      : "text-white/90"
                )}
              >
                {statusHint}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#001E62]/20 bg-white px-8 py-4 text-center">
            <p className="text-lg text-[#64748B]">{dateStr}</p>
            <p className="text-4xl font-bold tabular-nums text-[#001E62] md:text-5xl">{clock}</p>
          </div>
        </div>

        {flashMessage && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "rounded-2xl border-2 px-6 py-5 text-2xl font-bold md:text-3xl",
              flashMessage.includes("BLOCKED")
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-[#0D7A3B] bg-green-50 text-[#0D7A3B]"
            )}
          >
            {flashMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <section className="rounded-2xl border-2 border-[#001E62]/15 bg-white p-6">
              <Label htmlFor="badge-input" className="text-xl font-bold text-[#001E62]">
                Student Badge ID
              </Label>
              <div className="relative mt-3">
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
                  }}
                  className="absolute h-px w-px opacity-0"
                  aria-label="Student badge ID scanner input"
                />
                <div
                  role="textbox"
                  aria-readonly="true"
                  aria-labelledby="badge-input"
                  className="flex h-20 items-center rounded-2xl border border-[#001E62]/20 bg-[#F5F6F8] px-5 text-3xl font-semibold tracking-wide text-[#001E62]"
                >
                  {scanValue || (
                    <span className="text-2xl font-normal text-[#64748B]">
                      {scannerArmed ? "Scanner armed — scan badge now" : "Scan badge or tap numbers below"}
                    </span>
                  )}
                </div>
              </div>
              <ScanKeypad
                className="mt-5"
                onDigit={appendDigit}
                onBackspace={deleteLastDigit}
                onClear={clearScanValue}
              />
            </section>

            <section className="rounded-2xl border-2 border-[#001E62]/15 bg-white p-6">
              <h2 className="mb-5 text-2xl font-bold text-[#001E62]">Select Meal</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {MEAL_PRICES.map((meal) => {
                  const style = MEAL_STYLES[meal.type] ?? MEAL_STYLES.student_meal
                  const Icon = style.icon
                  const gradeRestricted =
                    meal.grades && student && !meal.grades.includes(student.grade)
                  const blocked = mealBlocked
                  const disabled = !student || !!gradeRestricted || blocked

                  return (
                    <button
                      key={meal.type}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleMeal(meal.label, meal.price)}
                      className={cn(
                        "flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl px-4 py-6 text-2xl font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40",
                        blocked ? "bg-red-600" : style.bg
                      )}
                    >
                      <Icon className="h-10 w-10" />
                      {blocked ? "BLOCKED" : meal.label}
                      {gradeRestricted && (
                        <span className="text-base font-normal opacity-90">Grades 9–12 only</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {!student && (
                <p className="mt-5 text-center text-xl text-[#64748B]">
                  Scan a student badge to enable meal buttons.
                </p>
              )}
            </section>
          </div>

          <aside className="rounded-2xl border-2 border-[#001E62]/15 bg-white p-6">
            <h2 className="mb-5 text-xl font-bold text-[#001E62]">Student Profile</h2>

            {student ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center">
                  <Image
                    src={student.photo}
                    alt={`${student.firstName} ${student.lastName}`}
                    width={140}
                    height={140}
                    className="rounded-2xl border-2 border-[#001E62]/20 object-cover"
                  />
                  <h3 className="mt-4 text-2xl font-bold text-[#001E62]">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-lg text-[#64748B]">
                    Grade {student.grade}
                    {student.homeroom ? ` · ${student.homeroom}` : ""}
                  </p>
                </div>

                {student.allergies.length > 0 && bannerStyle && (
                  <div
                    className={cn(
                      "rounded-xl border-2 p-4",
                      highestSeverity === "severe" && "border-red-500 bg-red-50",
                      highestSeverity === "moderate" && "border-yellow-500 bg-yellow-50",
                      highestSeverity === "informational" && "border-blue-500 bg-blue-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={cn(
                          "h-8 w-8 shrink-0",
                          highestSeverity === "severe" && "text-red-600",
                          highestSeverity === "moderate" && "text-yellow-600",
                          highestSeverity === "informational" && "text-blue-600"
                        )}
                      />
                      <div>
                        <p className="text-lg font-bold uppercase">{bannerStyle.label}</p>
                        {student.allergies.map((a) => (
                          <p key={a.name} className="text-base font-semibold">
                            {a.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-[#F5F6F8] px-4 py-3 text-center">
                  <p className="text-sm text-[#64748B]">Student ID</p>
                  <p className="text-2xl font-bold text-[#001E62]">{student.id}</p>
                </div>

                <div className="rounded-xl border-2 border-[#0D7A3B]/30 bg-green-50 p-5 text-center">
                  <p className="text-sm font-medium text-[#64748B]">Balance</p>
                  <p
                    className={cn(
                      "text-4xl font-bold tabular-nums",
                      localBalance <= 0 ? "text-red-600" : "text-[#0D7A3B]"
                    )}
                  >
                    {formatCurrency(localBalance)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetStation}
                  className="w-full rounded-xl border-2 border-[#001E62]/30 py-4 text-lg font-bold text-[#001E62] hover:bg-[#F5F6F8]"
                >
                  Clear &amp; Scan Next
                </button>
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center text-[#64748B]">
                <span className="relative mb-6 flex h-10 w-10 items-center justify-center" aria-hidden>
                  <span className="scan-ready-ring absolute inline-flex h-10 w-10 rounded-full bg-red-500" />
                  <span className="scan-ready-dot relative inline-flex h-6 w-6 rounded-full bg-red-600 ring-4 ring-red-600/30" />
                </span>
                <p className="text-2xl font-bold text-[#001E62]">Ready to scan</p>
                <p className="mt-3 text-lg">Demo student: 10457 — James Anderson (peanut allergy)</p>
                <p className="mt-2 text-base">Demo cashier badge: 90004 — j.wilson</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
