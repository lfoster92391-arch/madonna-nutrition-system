"use client"

import Image from "next/image"
import Link from "next/link"
import { Bell, CreditCard, History, Lock, Users, UtensilsCrossed, Wallet } from "lucide-react"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { AnnualReviewBanner } from "@/components/parent/AnnualReviewBanner"
import { FoodProfileStatusCard } from "@/components/parent/FoodProfileStatusCard"
import {
  getPendingSubmission,
  getStudentProfile,
  parentAnnouncements,
  parentLinkedStudents,
  parentRecentActivity,
  parentSpendingByWeek,
  todaysMenuItems,
} from "@/data/demo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

const totalBalance = parentLinkedStudents.reduce((sum, s) => sum + s.balance, 0)
const monthlySpending = parentSpendingByWeek.reduce((sum, w) => sum + w.amount, 0)
const lowBalanceStudents = parentLinkedStudents.filter((s) => s.balance < 5)

const quickActions = [
  { label: "Add Funds", href: "/parent/add-funds", icon: Wallet },
  { label: "Meal History", href: "/parent/meal-history", icon: History },
  { label: "Payment Methods", href: "/parent/payment-methods", icon: CreditCard },
  { label: "Low Balance Alerts", href: "/parent/alerts", icon: Bell },
  { label: "Manage Students", href: "/parent/students", icon: Users },
]

export default function ParentDashboardPage() {
  const { user } = useAuth()
  const { studentProfiles, allergySubmissions } = useDemo()
  const firstName = user?.displayName.split(" ")[0] ?? "Parent"

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <header className="border-b border-silver/40 bg-white px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Parent Portal</p>
            <h1 className="mt-1 text-2xl font-bold text-primary">
              Welcome back, {firstName}! Here&apos;s what&apos;s happening with your students.
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="relative rounded-2xl p-3 hover:bg-silver/20">
              <Bell className="h-6 w-6 text-primary" />
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-white">
                2
              </span>
            </button>
            <div className="text-right">
              <p className="font-semibold text-primary">{user?.displayName}</p>
              <p className="text-sm text-silver-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 p-8 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <AnnualReviewBanner profiles={studentProfiles.filter((p) => parentLinkedStudents.some((s) => s.id === p.studentId))} />

          <div className="grid gap-4 md:grid-cols-3">
            {parentLinkedStudents.map((student) => (
              <FoodProfileStatusCard
                key={student.id}
                studentId={student.id}
                studentName={`${student.firstName} ${student.lastName}`}
                profile={getStudentProfile(student.id, studentProfiles)}
                pendingSubmission={getPendingSubmission(student.id, allergySubmissions)}
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-silver-foreground">Total Account Balance</p>
                  <p className="mt-2 text-4xl font-bold text-primary">{formatCurrency(totalBalance)}</p>
                </div>
                <Wallet className="h-8 w-8 text-primary/40" />
              </div>
              <div className="mt-6 flex gap-3">
                <Button asChild className="flex-1">
                  <Link href="/parent/add-funds">ADD FUNDS</Link>
                </Button>
                <Button variant="outline" className="flex-1">
                  TRANSFER FUNDS
                </Button>
              </div>
            </Card>

            <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-primary">Recent Activity</h2>
                <Link href="/parent/transactions" className="text-sm font-semibold text-primary hover:underline">
                  VIEW ALL
                </Link>
              </div>
              <div className="space-y-3">
                {parentRecentActivity.slice(0, 4).map((item) => (
                  <div key={`${item.date}-${item.description}`} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-primary">{item.description}</p>
                      <p className="text-silver-foreground">
                        {item.date} · {item.student}
                      </p>
                    </div>
                    <span
                      className={`font-bold tabular-nums ${item.amount > 0 ? "text-success" : "text-primary"}`}
                    >
                      {item.amount > 0 ? `+ ${formatCurrency(item.amount)}` : formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold text-primary">My Students</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {parentLinkedStudents.map((student) => (
                <Card key={student.id} className="rounded-[20px] border-silver/60 p-5 shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <Image
                      src={student.photo}
                      alt={student.firstName}
                      width={80}
                      height={80}
                      className="rounded-2xl object-cover"
                    />
                    <h3 className="mt-3 font-bold text-primary">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-silver-foreground">Grade {student.grade}</p>
                    <p
                      className={`mt-2 text-2xl font-bold tabular-nums ${
                        student.balance < 5 ? "text-danger" : "text-success"
                      }`}
                    >
                      {formatCurrency(student.balance)}
                    </p>
                    <p className="mt-1 text-xs text-silver-foreground">Lunch Status: Active</p>
                    {student.balance < 5 && (
                      <>
                        <div className="mt-3 w-full rounded-xl bg-danger/10 px-3 py-2 text-xs font-bold uppercase text-danger">
                          Low Balance Alert
                        </div>
                        <Button asChild size="sm" className="mt-3 w-full">
                          <Link href="/parent/add-funds">ADD FUNDS</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-primary">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {quickActions.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-silver/40 p-4 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-center text-xs font-semibold text-primary">{label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-primary">Announcements</h2>
            <div className="space-y-4">
              {parentAnnouncements.map((ann) => (
                <div key={ann.id} className="border-b border-silver/30 pb-4 last:border-0 last:pb-0">
                  <p className="font-semibold text-primary">{ann.title}</p>
                  <p className="mt-1 text-sm text-silver-foreground">{ann.body}</p>
                  <button type="button" className="mt-2 text-sm font-semibold text-primary hover:underline">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {lowBalanceStudents.length > 0 && (
            <Card className="rounded-[20px] border-danger/30 bg-danger/5 p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-danger">Low Balance Alerts</h2>
              {lowBalanceStudents.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-sm text-danger">{formatCurrency(s.balance)} balance</p>
                  </div>
                  <Button asChild size="sm">
                    <Link href="/parent/add-funds">ADD FUNDS</Link>
                  </Button>
                </div>
              ))}
            </Card>
          )}

          <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-primary">Spending This Month</h2>
            <p className="mb-4 text-2xl font-bold text-primary">{formatCurrency(monthlySpending)}</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={parentSpendingByWeek}>
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={40} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="amount" fill="#001E62" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-primary">Today&apos;s Menu</h2>
            </div>
            <p className="mb-3 text-sm text-silver-foreground">
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
            <ul className="space-y-2">
              {todaysMenuItems.map((item) => (
                <li key={item} className="text-sm text-primary">
                  • {item}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <footer className="mt-8 border-t border-silver/40 bg-white px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-silver-foreground">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <Lock className="h-4 w-4" />
            SECURE &amp; PRIVATE
          </div>
          <p className="text-center">
            Questions? Contact Nutrition Services at{" "}
            <a href="mailto:nutrition@madonnahs.org" className="text-primary hover:underline">
              nutrition@madonnahs.org
            </a>{" "}
            or (304) 748-4414
          </p>
          <p className="text-xs uppercase tracking-wide">
            Powered by Madonna Nutrition Management System
          </p>
        </div>
      </footer>
    </div>
  )
}
