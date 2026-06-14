"use client"

import { useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parentLinkedStudents } from "@/data/demo"
import { Card } from "@/components/ui/card"

export default function StudentProfileIndexPage() {
  const router = useRouter()
  const students = useMemo(() => parentLinkedStudents, [])

  useEffect(() => {
    if (students.length === 1) {
      router.replace(`/parent/student-profile/${students[0].id}`)
    }
  }, [students, router])

  if (students.length === 1) return null

  return (
    <div className="min-h-screen bg-[#f8f9fb] p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Food Safety Center</p>
          <h1 className="mt-1 text-2xl font-bold text-primary">Select a Student</h1>
          <p className="text-silver-foreground">Choose a student to manage their nutrition profile.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {students.map((student) => (
            <Link key={student.id} href={`/parent/student-profile/${student.id}`}>
              <Card className="rounded-[20px] p-6 text-center transition hover:border-primary/30 hover:shadow-md">
                <Image
                  src={student.photo}
                  alt={student.firstName}
                  width={80}
                  height={80}
                  className="mx-auto rounded-2xl object-cover"
                />
                <h3 className="mt-3 font-bold text-primary">
                  {student.firstName} {student.lastName}
                </h3>
                <p className="text-sm text-silver-foreground">Grade {student.grade}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
