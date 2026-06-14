"use client"

import { students } from "@/data/mockstudents"
import { mockMenu } from "@/data/mockMenu"

export default function ParentPortalPage() {
  const student = students[0]

  const todayMenu = mockMenu[0]

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-6xl space-y-8">

        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Parent Portal
          </h1>

          <p className="mt-2 text-slate-400">
            Student meal activity and cafeteria overview
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center gap-5">

              <img
                src={student.photo}
                alt="Student"
                className="h-24 w-24 rounded-2xl border border-slate-700 object-cover"
              />

              <div>
                <h2 className="text-2xl font-bold">
                  {student.firstName} {student.lastName}
                </h2>

                <p className="mt-1 text-slate-400">
                  Grade {student.grade}
                </p>
              </div>

            </div>

            <div className="mt-6 space-y-4">

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                <div className="text-sm text-slate-400">
                  Current Balance
                </div>

                <div
                  className={`mt-2 text-4xl font-bold ${
                    student.balance < 5
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  ${student.balance.toFixed(2)}
                </div>

              </div>

              {student.balance < 5 && (
                <div className="rounded-xl border border-yellow-700 bg-yellow-950 p-4 text-yellow-300">
                  Low balance warning detected
                </div>
              )}

            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="text-2xl font-bold">
              Allergy Information
            </h2>

            <div className="mt-6 space-y-3">

              {student.allergies.map((allergy) => (
                <div
                  key={allergy}
                  className="rounded-xl border border-red-700 bg-red-950 px-4 py-3 font-semibold text-red-300"
                >
                  {allergy}
                </div>
              ))}

            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="text-2xl font-bold">
              Today's Lunch Menu
            </h2>

            <div className="mt-6 space-y-5">

              <div>
                <div className="text-sm text-slate-400">
                  Main Meal
                </div>

                <div className="mt-2 text-3xl font-bold">
                  {todayMenu.meal}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400">
                  Side Items
                </div>

                <div className="mt-3 flex flex-wrap gap-2">

                  {todayMenu.sides.map((side) => (
                    <div
                      key={side}
                      className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    >
                      {side}
                    </div>
                  ))}

                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                <div className="text-sm text-slate-400">
                  Beverage
                </div>

                <div className="mt-2 text-xl font-semibold">
                  {todayMenu.drink}
                </div>

              </div>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-2xl font-bold">
            Recent Meal Activity
          </h2>

          <div className="mt-6 space-y-4">

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-4">

              <div>
                <div className="font-semibold">
                  Lunch Purchase
                </div>

                <div className="text-sm text-slate-400">
                  Cafeteria Scan Station
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold">
                  -$3.25
                </div>

                <div className="text-sm text-slate-400">
                  Today • 11:42 AM
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-4">

              <div>
                <div className="font-semibold">
                  Breakfast Purchase
                </div>

                <div className="text-sm text-slate-400">
                  Cafeteria Scan Station
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold">
                  -$2.00
                </div>

                <div className="text-sm text-slate-400">
                  Yesterday • 8:01 AM
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </main>
  )
}