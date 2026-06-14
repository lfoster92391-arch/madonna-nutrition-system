"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Search } from "lucide-react"
import {
  getRecentStudents,
  useTeacherData,
} from "@/components/providers/TeacherDataProvider"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TEACHER_NAVY } from "@/data/demo/teacher"

export function StudentLookup() {
  const {
    searchStudents,
    selectStudent,
    recentStudentIds,
    rememberRecent,
    setRememberRecent,
    clearRecentStudents,
    searchResults,
  } = useTeacherData()
  const [query, setQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      void searchStudents(query)
    }, 250)
    return () => clearTimeout(timer)
  }, [query, searchStudents])

  const recentStudents = getRecentStudents(recentStudentIds)
  const displayList = query.trim() ? searchResults : recentStudents

  return (
    <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
      <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
        Student Lookup &amp; Sign Up
      </h2>
      <div className="relative mt-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#AEB6C2" }} />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or student ID..."
          className="h-12 pl-11"
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <label className="flex cursor-pointer items-center gap-2" style={{ color: TEACHER_NAVY }}>
          <input
            type="checkbox"
            checked={rememberRecent}
            onChange={(e) => setRememberRecent(e.target.checked)}
            className="h-4 w-4 rounded accent-[#041B52]"
          />
          Remember recent students
        </label>
        <button
          type="button"
          onClick={clearRecentStudents}
          className="font-medium hover:underline"
          style={{ color: TEACHER_NAVY }}
        >
          Clear
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {displayList.length === 0 ? (
          <p className="text-sm text-silver-foreground">No students found.</p>
        ) : (
          displayList.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => selectStudent(student.id)}
              className="flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition hover:bg-[#041B52]/5"
              style={{ borderColor: "#AEB6C2" }}
            >
              <Image
                src={student.photo}
                alt={`${student.firstName} ${student.lastName}`}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold" style={{ color: TEACHER_NAVY }}>
                  {student.firstName} {student.lastName}
                </p>
                <p className="text-xs text-silver-foreground">Grade {student.grade}</p>
              </div>
            </button>
          ))
        )}
      </div>
      {!query.trim() && displayList.length > 0 ? (
        <p className="mt-3 text-xs text-silver-foreground">Recent students</p>
      ) : null}
    </Card>
  )
}
