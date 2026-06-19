"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { QrCode, Search, UserPlus } from "lucide-react"
import {
  getRecentStudents,
  useTeacherData,
} from "@/components/providers/TeacherDataProvider"
import { StudentFoundPanel } from "@/components/teacher/StudentFoundPanel"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"

const GRADES = ["All", "8", "9", "10", "11", "12"]

export function TeacherFindStudentSection() {
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
  const [grade, setGrade] = useState("All")
  const [activeSearch, setActiveSearch] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!activeSearch) return
    const timer = setTimeout(() => {
      void searchStudents(query)
    }, 250)
    return () => clearTimeout(timer)
  }, [query, searchStudents, activeSearch])

  const recentStudents = getRecentStudents(recentStudentIds)
  const rawList = query.trim() || activeSearch ? searchResults : recentStudents
  const displayList =
    grade === "All" ? rawList : rawList.filter((s) => s.grade === grade)

  function handleSearch() {
    setActiveSearch(true)
    void searchStudents(query)
  }

  function handleScan() {
    searchRef.current?.focus()
    setQuery("")
    setActiveSearch(true)
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEACHER_NAVY }}>
          Find Student
        </h2>
        <p className="mt-1 text-sm" style={{ color: TEACHER_SILVER }}>
          Search by name or student ID, add lunch participation, or check roster status.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          className="rounded-2xl border p-6 shadow-sm"
          style={{ borderColor: TEACHER_SILVER }}
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
            <div className="relative sm:col-span-3">
              <Search
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: TEACHER_SILVER }}
              />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name or student ID..."
                className="h-12 pl-11"
              />
            </div>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="h-12 rounded-xl border bg-white px-4 text-sm"
              style={{ borderColor: TEACHER_SILVER, color: TEACHER_NAVY }}
              aria-label="Filter by grade"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g === "All" ? "All Grades" : `Grade ${g}`}
                </option>
              ))}
            </select>
            <Button className="h-12" onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" className="h-11" onClick={handleScan}>
              <QrCode className="mr-2 h-4 w-4" />
              Scan Student ID
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => {
                searchRef.current?.focus()
                setQuery("")
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Quick Add Student
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2" style={{ color: TEACHER_NAVY }}>
              <input
                type="checkbox"
                checked={rememberRecent}
                onChange={(e) => setRememberRecent(e.target.checked)}
                className="h-4 w-4 rounded accent-[#0A1E3F]"
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

          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {displayList.length === 0 ? (
              <p className="text-sm text-silver-foreground">No students found.</p>
            ) : (
              displayList.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => selectStudent(student.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition hover:bg-[#0A1E3F]/5"
                  style={{ borderColor: TEACHER_SILVER }}
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
                    <p className="text-xs text-silver-foreground">
                      Grade {student.grade} · ID {student.id}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          {!query.trim() && !activeSearch && displayList.length > 0 ? (
            <p className="mt-3 text-xs text-silver-foreground">Recent students</p>
          ) : null}
        </Card>

        <StudentFoundPanel />
      </div>
    </section>
  )
}
