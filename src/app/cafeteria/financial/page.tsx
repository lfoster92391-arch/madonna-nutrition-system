"use client"

import { students } from "@/data/mockstudents"

export default function FinancialPage() {
  const lowBalanceStudents = students.filter(
    (student: any) =>
      student.balance >= 0 && student.balance < 5
  )

  const negativeBalanceStudents = students.filter(
    (student: any) => student.balance < 0
  )

  const totalBalances = students.reduce(
    (total, student: any) => total + student.balance,
    0
  )

  const estimatedDailyRevenue =
    students.length * 3.25

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">

        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Financial Oversight Center
          </h1>

          <p className="mt-2 text-slate-400">
            Cafeteria account monitoring and balance analytics
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Total Student Balances
            </div>

            <div className="mt-3 text-5xl font-bold text-green-400">
              ${totalBalances.toFixed(2)}
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Low Balance Students
            </div>

            <div className="mt-3 text-5xl font-bold text-yellow-400">
              {lowBalanceStudents.length}
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Negative Accounts
            </div>

            <div className="mt-3 text-5xl font-bold text-red-400">
              {negativeBalanceStudents.length}
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Estimated Daily Revenue
            </div>

            <div className="mt-3 text-5xl font-bold text-blue-400">
              ${estimatedDailyRevenue.toFixed(2)}
            </div>

          </div>

        </div>

        <div className="grid gap-6 xl:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-bold">
                  Low Balance Monitoring
                </h2>

                <p className="mt-1 text-slate-400">
                  Students approaching low account thresholds
                </p>
              </div>

              <div className="rounded-full border border-yellow-700 bg-yellow-950 px-4 py-2 text-sm font-semibold text-yellow-300">
                {lowBalanceStudents.length} Alerts
              </div>

            </div>

            <div className="mt-6 space-y-4">

              {lowBalanceStudents.map((student: any) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between rounded-xl border border-yellow-700 bg-yellow-950 px-5 py-4"
                >

                  <div>
                    <div className="font-semibold">
                      {student.firstName} {student.lastName}
                    </div>

                    <div className="text-sm text-yellow-200">
                      Grade {student.grade}
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-yellow-300">
                    ${student.balance.toFixed(2)}
                  </div>

                </div>
              ))}

            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-bold">
                  Negative Account Oversight
                </h2>

                <p className="mt-1 text-slate-400">
                  Students with negative cafeteria balances
                </p>
              </div>

              <div className="rounded-full border border-red-700 bg-red-950 px-4 py-2 text-sm font-semibold text-red-300">
                {negativeBalanceStudents.length} Accounts
              </div>

            </div>

            <div className="mt-6 space-y-4">

              {negativeBalanceStudents.map((student: any) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between rounded-xl border border-red-700 bg-red-950 px-5 py-4"
                >

                  <div>
                    <div className="font-semibold">
                      {student.firstName} {student.lastName}
                    </div>

                    <div className="text-sm text-red-200">
                      Grade {student.grade}
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-red-300">
                    ${student.balance.toFixed(2)}
                  </div>

                </div>
              ))}

            </div>

          </div>

        </div>

      </div>
    </main>
  )
}