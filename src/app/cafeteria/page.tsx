"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import {
  ScanLine,
  Users,
  Package,
  Trash2,
  ClipboardList,
  Bell,
  DollarSign,
  Activity,
  AlertTriangle,
  BrainCircuit,
  ClipboardCheck,
  BarChart3,
  Flame,
} from "lucide-react"

import { students } from "@/data/mockstudents"
import { mockInventory } from "@/data/mockInventory"
import { mockWaste } from "@/data/mockWaste"
import { mockNotifications } from "@/data/mockNotifications"
import { mockActivity } from "@/data/mockActivity"

export default function CafeteriaPage() {
  const [currentTime, setCurrentTime] =
    useState("")

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString()
      )
    }

    updateTime()

    const interval = setInterval(
      updateTime,
      1000
    )

    return () => clearInterval(interval)
  }, [])

  const lowBalanceStudents = students.filter(
    (student: any) => student.balance < 5
  )

  const lowStockItems = mockInventory.filter(
    (item) =>
      item.quantity <= item.lowStockThreshold
  )

  const totalWaste = mockWaste.reduce(
    (total, item) =>
      total + item.quantityWasted,
    0
  )

  const criticalNotifications =
    mockNotifications.filter(
      (notification) =>
        notification.type === "critical"
    )

  const recentActivity = mockActivity.slice(
    0,
    4
  )

  const modules = [
    {
      label: "Scan Station",
      href: "/cafeteria/scan",
      icon: ScanLine,
    },

    {
      label: "Students",
      href: "/cafeteria/students",
      icon: Users,
    },

    {
      label: "Inventory",
      href: "/cafeteria/inventory",
      icon: Package,
    },

    {
      label: "Waste",
      href: "/cafeteria/waste",
      icon: Trash2,
    },

    {
      label: "Weekly Menu",
      href: "/cafeteria/menu",
      icon: ClipboardList,
    },

    {
      label: "Notifications",
      href: "/cafeteria/notifications",
      icon: Bell,
    },

    {
      label: "Financial Center",
      href: "/cafeteria/financial",
      icon: DollarSign,
    },

    {
      label: "Activity Feed",
      href: "/cafeteria/activity",
      icon: Activity,
    },

    {
      label: "Incident Center",
      href: "/cafeteria/incidents",
      icon: AlertTriangle,
    },

    {
      label: "Predictive Insights",
      href:
        "/cafeteria/predictive-insights",
      icon: BrainCircuit,
    },

    {
      label: "Task Center",
      href: "/cafeteria/tasks",
      icon: ClipboardCheck,
    },

    {
      label: "Performance Analytics",
      href: "/cafeteria/performance",
      icon: BarChart3,
    },
  ]

  const priorityActions = [
    {
      title:
        "Milk Cooler Temperature Violation",
      severity: "Critical",
      description:
        "Immediate food safety review required.",
    },

    {
      title:
        "Chicken Patties Inventory Shortage",
      severity: "High",
      description:
        "Restock recommended before next lunch period.",
    },

    {
      title:
        "5 Student Accounts Approaching Negative Balance",
      severity: "Warning",
      description:
        "Parent notifications recommended.",
    },
  ]

  function getPriorityStyles(
    severity: string
  ) {
    switch (severity) {
      case "Critical":
        return "border-red-700 bg-red-950 text-red-300 shadow-lg shadow-red-950/40"

      case "High":
        return "border-yellow-700 bg-yellow-950 text-yellow-300 shadow-lg shadow-yellow-950/30"

      default:
        return "border-blue-700 bg-blue-950 text-blue-300 shadow-lg shadow-blue-950/30"
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 xl:px-8">

          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Madonna Nutrition Management System
            </h1>

            <p className="mt-1 text-sm text-slate-400 md:text-base">
              Executive Cafeteria Operations Center
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">

            <div className="rounded-full border border-green-700 bg-green-950 px-3 py-2 text-xs font-semibold text-green-300 shadow-md shadow-green-950/40 md:px-4 md:text-sm">
              System Online
            </div>

            <div className="rounded-full border border-blue-700 bg-blue-950 px-3 py-2 text-xs font-semibold text-blue-300 shadow-md shadow-blue-950/40 md:px-4 md:text-sm">
              Lunch Period Active
            </div>

            <div className="rounded-full border border-yellow-700 bg-yellow-950 px-3 py-2 text-xs font-semibold text-yellow-300 shadow-md shadow-yellow-950/40 md:px-4 md:text-sm">
              Nutrition Director
            </div>

            <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 md:px-4 md:text-sm">
              {currentTime}
            </div>

          </div>

        </div>

      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6 xl:p-8">

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">

          <div className="rounded-2xl border border-orange-700 bg-orange-950 p-5 shadow-2xl shadow-orange-950/30 md:p-6">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-4">

                <div className="rounded-xl bg-orange-900 p-3 shadow-lg shadow-orange-950/50">
                  <Flame className="h-6 w-6 text-orange-300" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-orange-200">
                    Priority Operations Queue
                  </h2>

                  <p className="mt-1 text-sm text-orange-300/80 md:text-base">
                    Immediate executive operational attention
                  </p>
                </div>

              </div>

              <div className="w-fit rounded-full border border-orange-500 px-4 py-2 text-xs font-semibold text-orange-200 shadow-md shadow-orange-950/40 md:text-sm">
                {priorityActions.length} Active Priorities
              </div>

            </div>

            <div className="mt-6 space-y-4">

              {priorityActions.map(
                (priority, index) => (
                  <div
                    key={index}
                    className={`rounded-xl border px-4 py-5 transition-all duration-200 hover:scale-[1.01] md:px-5 ${getPriorityStyles(
                      priority.severity
                    )}`}
                  >

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                      <div>
                        <div className="text-lg font-bold md:text-xl">
                          {priority.title}
                        </div>

                        <div className="mt-2 text-sm md:text-base">
                          {priority.description}
                        </div>
                      </div>

                      <div className="w-fit rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                        {priority.severity}
                      </div>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">

            <div className="rounded-2xl border border-green-800 bg-slate-900 p-5 shadow-xl shadow-green-950/20 md:p-6">

              <div className="text-sm text-slate-400">
                Operational Health
              </div>

              <div className="mt-3 text-4xl font-bold text-green-400 md:text-5xl">
                96%
              </div>

            </div>

            <div className="rounded-2xl border border-blue-800 bg-slate-900 p-5 shadow-xl shadow-blue-950/20 md:p-6">

              <div className="text-sm text-slate-400">
                Active Staff
              </div>

              <div className="mt-3 text-4xl font-bold text-blue-400 md:text-5xl">
                14
              </div>

            </div>

            <div className="rounded-2xl border border-yellow-800 bg-slate-900 p-5 shadow-xl shadow-yellow-950/20 md:p-6">

              <div className="text-sm text-slate-400">
                Low Balance Students
              </div>

              <div className="mt-3 text-4xl font-bold text-yellow-400 md:text-5xl">
                {lowBalanceStudents.length}
              </div>

            </div>

            <div className="rounded-2xl border border-red-800 bg-slate-900 p-5 shadow-xl shadow-red-950/20 md:p-6">

              <div className="text-sm text-slate-400">
                Active Notifications
              </div>

              <div className="mt-3 text-4xl font-bold text-red-400 md:text-5xl">
                {mockNotifications.length}
              </div>

            </div>

          </div>

        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/30 md:p-6">

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-2xl font-bold">
                  Operational Activity Feed
                </h2>

                <p className="mt-1 text-sm text-slate-400 md:text-base">
                  Recent cafeteria operational activity
                </p>
              </div>

              <Link
                href="/cafeteria/activity"
                className="text-sm font-semibold text-blue-400 hover:text-blue-300"
              >
                View All
              </Link>

            </div>

            <div className="mt-6 space-y-4">

              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4 transition-all duration-200 hover:scale-[1.01] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-950/20 md:px-5"
                >

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                    <div>
                      <div className="font-semibold">
                        {activity.event}
                      </div>

                      <div className="mt-1 text-sm text-slate-400">
                        {activity.description}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500">
                      {activity.timestamp}
                    </div>

                  </div>

                </div>
              ))}

            </div>

          </div>

          <div className="space-y-6">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/30 md:p-6">

              <div>
                <h2 className="text-2xl font-bold">
                  Executive Metrics
                </h2>

                <p className="mt-1 text-sm text-slate-400 md:text-base">
                  Operational overview summary
                </p>
              </div>

              <div className="mt-6 space-y-4">

                <div className="rounded-xl border border-yellow-800 bg-slate-950 p-4 shadow-lg shadow-yellow-950/20">

                  <div className="text-sm text-slate-400">
                    Current Lunch Period
                  </div>

                  <div className="mt-2 text-2xl font-bold text-yellow-400">
                    Grade 10
                  </div>

                </div>

                <div className="rounded-xl border border-red-800 bg-slate-950 p-4 shadow-lg shadow-red-950/20">

                  <div className="text-sm text-slate-400">
                    Waste Units Logged
                  </div>

                  <div className="mt-2 text-3xl font-bold text-red-300">
                    {totalWaste}
                  </div>

                </div>

                <div className="rounded-xl border border-red-800 bg-slate-950 p-4 shadow-lg shadow-red-950/20">

                  <div className="text-sm text-slate-400">
                    Low Inventory Items
                  </div>

                  <div className="mt-2 text-3xl font-bold text-red-400">
                    {lowStockItems.length}
                  </div>

                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/30 md:p-6">

              <div>
                <h2 className="text-2xl font-bold">
                  Quick Actions
                </h2>

                <p className="mt-1 text-sm text-slate-400 md:text-base">
                  Rapid operational access
                </p>
              </div>

              <div className="mt-6 grid gap-3">

                {modules.map((module) => {
                  const Icon = module.icon

                  return (
                    <Link
                      key={module.href}
                      href={module.href}
                      className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 px-4 py-4 transition-all duration-200 hover:scale-[1.01] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-950/20 md:px-5"
                    >

                      <Icon className="h-5 w-5 text-blue-400" />

                      <div className="font-semibold">
                        {module.label}
                      </div>

                    </Link>
                  )
                })}

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  )
}