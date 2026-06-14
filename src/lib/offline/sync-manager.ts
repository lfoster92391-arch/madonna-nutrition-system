import { api } from "@/lib/api/client"
import type { Student, Transaction } from "@/lib/types"
import {
  applySyncedBalances,
  cacheStudents,
  getOrCreateDeviceId,
  getPendingTransactions,
  removePendingTransactions,
  type QueuedTransaction,
} from "./scan-offline-db"

export type SyncResult =
  | {
      ok: true
      synced: number
      skipped: number
      message: string
      balances?: Record<string, number>
    }
  | { ok: false; error: string }

export function isBrowserOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true
}

export async function refreshStudentCache(students: Student[]): Promise<void> {
  if (students.length === 0) return
  await cacheStudents(students)
}

export async function refreshStudentCacheFromServer(): Promise<Student[]> {
  const students = await api.getStudents()
  await cacheStudents(students)
  return students
}

export async function syncPendingTransactions(options?: {
  demoReplay?: (tx: QueuedTransaction) => Promise<Transaction | null>
}): Promise<SyncResult> {
  const pending = await getPendingTransactions()
  if (pending.length === 0) {
    return { ok: true, synced: 0, skipped: 0, message: "Back online" }
  }

  const deviceId = await getOrCreateDeviceId()
  const payload = pending.map(({ balanceAfter: _b, studentName: _n, ...tx }) => ({
    ...tx,
    deviceId: tx.deviceId ?? deviceId,
  }))

  try {
    const result = await api.syncBatch(payload)
    await removePendingTransactions(
      pending.map((tx) => tx.clientTxId).filter((id) => !result.failedIds?.includes(id))
    )
    if (result.balances && Object.keys(result.balances).length > 0) {
      await applySyncedBalances(result.balances)
    }
    return {
      ok: true,
      synced: result.synced,
      skipped: result.skipped,
      balances: result.balances,
      message: `Back online — ${result.synced} transaction${result.synced === 1 ? "" : "s"} synced`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed"
    if (message.includes("503") || message.includes("not configured") || options?.demoReplay) {
      let synced = 0
      const syncedIds: string[] = []
      for (const tx of pending) {
        const replayed = await options?.demoReplay?.(tx)
        if (replayed) {
          synced++
          syncedIds.push(tx.clientTxId)
        }
      }
      if (synced > 0) {
        await removePendingTransactions(syncedIds)
        return {
          ok: true,
          synced,
          skipped: pending.length - synced,
          message: `Back online — ${synced} transaction${synced === 1 ? "" : "s"} synced`,
        }
      }
    }
    return { ok: false, error: message }
  }
}

export function createQueuedTransaction(input: {
  studentId: string
  studentName: string
  mealType: string
  amount: number
  balanceAfter: number
  deviceId?: string
}): QueuedTransaction {
  return {
    clientTxId: crypto.randomUUID(),
    studentId: input.studentId,
    studentName: input.studentName,
    mealType: input.mealType,
    amount: input.amount,
    timestamp: new Date().toISOString(),
    processedByName: "Station",
    deviceId: input.deviceId,
    balanceAfter: input.balanceAfter,
  }
}
