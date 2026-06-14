"use client"

import { useMemo } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import {
  filterByPeriod,
  filterByStudent,
  isDepositTransaction,
  isMealTransaction,
  sortTransactionsNewestFirst,
  type MealPeriodFilter,
} from "@/lib/parent-transactions"
import type { Transaction } from "@/lib/types"

export function useParentTransactions() {
  const { user } = useAuth()
  const { transactions, users, students, isLoading } = useDemo()

  const linkedStudentIds = useMemo(() => {
    if (!user) return new Set<string>()
    const demoUser = users.find((u) => u.id === user.id)
    return new Set(demoUser?.linkedStudentIds ?? [])
  }, [user, users])

  const linkedStudents = useMemo(
    () => students.filter((s) => linkedStudentIds.has(s.id)),
    [students, linkedStudentIds]
  )

  const familyTransactions = useMemo(
    () =>
      sortTransactionsNewestFirst(
        transactions.filter((tx) => linkedStudentIds.has(tx.studentId))
      ),
    [transactions, linkedStudentIds]
  )

  const mealTransactions = useMemo(
    () => familyTransactions.filter(isMealTransaction),
    [familyTransactions]
  )

  const depositTransactions = useMemo(
    () => familyTransactions.filter(isDepositTransaction),
    [familyTransactions]
  )

  return {
    isLoading,
    linkedStudents,
    familyTransactions,
    mealTransactions,
    depositTransactions,
    getStudentMeals: (studentId: string, period: MealPeriodFilter = "all") =>
      filterByPeriod(
        mealTransactions.filter((tx) => tx.studentId === studentId),
        period
      ),
    getFilteredMeals: (studentId: string | "all", period: MealPeriodFilter) =>
      filterByPeriod(filterByStudent(mealTransactions, studentId), period),
  }
}

export type { MealPeriodFilter, Transaction }
