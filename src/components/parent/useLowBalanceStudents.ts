"use client"

import { useEffect, useState } from "react"
import { getLowBalanceStudents } from "@/lib/parent-balance-alerts"

type StudentLike = {
  id: string
  firstName: string
  lastName: string
  balance: number
}

export function useLowBalanceStudents(students: StudentLike[]) {
  const [lowBalanceStudents, setLowBalanceStudents] = useState<StudentLike[]>(() =>
    students.filter((s) => s.balance < 10)
  )

  useEffect(() => {
    setLowBalanceStudents(getLowBalanceStudents(students))
  }, [students])

  return lowBalanceStudents
}
