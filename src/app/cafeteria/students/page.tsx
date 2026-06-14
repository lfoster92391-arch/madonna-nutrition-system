"use client"

import { useMemo, useState } from "react"
import { students } from "@/data/mockstudents"

export default function StudentsPage() {
  const [searchValue, setSearchValue] = useState("")

  const filteredStudents = useMemo(() => {
    return students.filter((student: any) => {
      const fullName =
        `${student.firstName} ${student.lastName}`.toLowerCase()

      return (
        fullName.includes(searchValue.toLowerCase()) ||
        student.studentId.includes(searchValue)
      )
    })
  }, [searchValue])

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Student Management
            </h1>

            <p className="mt-2 text-slate-400">
              Cafeteria student account monitoring and administration
            </p>
          </div>

          <div className="rounded-full border border-blue-700 bg-blue-950 px-4 py-2 text-sm font-semibold text-blue-300">
            {students.length} Students
          </div>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <label className="block text-sm font-medium text-slate-300 mb-3">
            Search Students
          </label>

          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by student name or ID..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-lg outline-none focus:border-blue-500"
          />

        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {filteredStudents.map((student: any) => {
            const hasLowBalance = student.balance < 5

            return (
              <div
                key={student.studentId}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >

                <div className="flex items-start gap-5">

                  <img
                    src={student.photo}
                    alt="Student"
                    className="h-24 w-24 rounded-2xl border border-slate-700 object-cover"
                  />

                  <div className="flex-1">

                    <h2 className="text-2xl font-bold">
                      {student.firstName} {student.lastName}
                    </h2>

                    <p className="mt-1 text-slate-400">
                      Grade {student.grade}
                    </p>

                    <div className="mt-3 text-sm text-slate-500">
                      Student ID: {student.studentId}
                    </div>

                  </div>

                </div>

                <div className="mt-6 grid gap-4">

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                    <div className="text-sm text-slate-400">
                      Current Balance
                    </div>

                    <div
                      className={`mt-2 text-4xl font-bold ${
                        student.balance < 0
                          ? "text-red-400"
                          : hasLowBalance
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      ${student.balance.toFixed(2)}
                    </div>

                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                    <div className="text-sm text-slate-400 mb-3">
                      Allergy Information
                    </div>

                    {student.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">

                        {student.allergies.map(
                          (allergy: string) => (
                            <div
                              key={allergy}
                              className="rounded-full border border-red-700 bg-red-950 px-3 py-2 text-sm font-semibold text-red-300"
                            >
                              {allergy}
                            </div>
                          )
                        )}

                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        No registered allergies
                      </div>
                    )}

                  </div>

                  {hasLowBalance && (
                    <div className="rounded-xl border border-yellow-700 bg-yellow-950 p-4 text-yellow-300">

                      <div className="font-semibold">
                        Low Balance Warning
                      </div>

                      <p className="mt-1 text-sm">
                        Student cafeteria balance is below recommended threshold.
                      </p>

                    </div>
                  )}

                </div>

              </div>
            )
          })}

        </div>

      </div>
    </main>
  )
}