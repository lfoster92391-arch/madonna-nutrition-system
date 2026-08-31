import type { QueryClient } from "@tanstack/react-query"
import { scanIdsEquivalent } from "@/lib/scan/scan-id"
import type { Student, User } from "@/lib/types"

/**
 * Immediately patch React Query caches after office add/take money (or kiosk funds),
 * then invalidate so every open view refetches ledger + balances.
 */
export async function syncBalanceCaches(
  queryClient: QueryClient,
  input: {
    studentId?: string
    balanceAfter?: number
    staffUserId?: string
    staffBalanceAfter?: number
  }
): Promise<void> {
  if (input.studentId && typeof input.balanceAfter === "number") {
    const studentId = input.studentId
    const balanceAfter = input.balanceAfter
    queryClient.setQueryData<Student[]>(["students"], (prev) => {
      if (!prev) return prev
      return prev.map((s) =>
        s.id === studentId || scanIdsEquivalent(s.id, studentId)
          ? { ...s, balance: balanceAfter }
          : s
      )
    })
  }

  if (input.staffUserId && typeof input.staffBalanceAfter === "number") {
    const staffUserId = input.staffUserId
    const staffBalanceAfter = input.staffBalanceAfter
    queryClient.setQueryData<User[]>(["users"], (prev) => {
      if (!prev) return prev
      return prev.map((u) =>
        u.id === staffUserId ? { ...u, accountBalance: staffBalanceAfter } : u
      )
    })
  }

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["students"] }),
    queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["users"] }),
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
    queryClient.invalidateQueries({ queryKey: ["student-me"] }),
  ])
}
