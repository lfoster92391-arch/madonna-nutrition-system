import type { Allergy, Student } from "@/lib/types"

const DB_NAME = "mnms-scan-offline"
const DB_VERSION = 1

export interface CachedStudent {
  id: string
  externalId: string
  firstName: string
  lastName: string
  photo: string
  grade: string
  balance: number
  allergies: Allergy[]
  disabled?: boolean
}

export interface QueuedTransaction {
  clientTxId: string
  studentId: string
  mealType: string
  amount: number
  timestamp: string
  processedByName: string
  deviceId?: string
  balanceAfter: number
  studentName: string
}

type MetaKey = "deviceId" | "lastCacheAt"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("students")) {
        db.createObjectStore("students", { keyPath: "externalId" })
      }
      if (!db.objectStoreNames.contains("pendingTransactions")) {
        db.createObjectStore("pendingTransactions", { keyPath: "clientTxId" })
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta")
      }
    }
  })
}

function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | void> {
  return openDb().then(
    (db) =>
      new Promise<T | void>((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const store = tx.objectStore(storeName)
        const request = fn(store)
        tx.oncomplete = () => {
          if (request instanceof IDBRequest) {
            resolve(request.result)
          } else {
            resolve()
          }
        }
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"))
      })
  )
}

export function studentToCached(student: Student): CachedStudent {
  return {
    id: student.id,
    externalId: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    photo: student.photo,
    grade: student.grade,
    balance: student.balance,
    allergies: student.allergies,
    disabled: student.disabled,
  }
}

export function cachedToStudent(cached: CachedStudent): Student {
  return {
    id: cached.externalId,
    firstName: cached.firstName,
    lastName: cached.lastName,
    photo: cached.photo,
    grade: cached.grade,
    balance: cached.balance,
    allergies: cached.allergies,
    dietaryRestrictions: [],
    parentContacts: [],
    disabled: cached.disabled,
  }
}

export async function cacheStudents(students: Student[]): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("students", "readwrite")
    const store = tx.objectStore("students")
    for (const student of students) {
      store.put(studentToCached(student))
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("Failed to cache students"))
  })
  await setMeta("lastCacheAt", new Date().toISOString())
}

export async function findCachedStudent(externalId: string): Promise<CachedStudent | null> {
  const result = await runTransaction<CachedStudent>("students", "readonly", (store) =>
    store.get(externalId)
  )
  return (result as CachedStudent | undefined) ?? null
}

export async function updateCachedStudentBalance(
  externalId: string,
  balance: number
): Promise<void> {
  const cached = await findCachedStudent(externalId)
  if (!cached) return
  await runTransaction("students", "readwrite", (store) => {
    store.put({ ...cached, balance })
  })
}

export async function applySyncedBalances(
  balances: Record<string, number>
): Promise<void> {
  const entries = Object.entries(balances)
  if (entries.length === 0) return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("students", "readwrite")
    const store = tx.objectStore("students")
    for (const [externalId, balance] of entries) {
      const getReq = store.get(externalId)
      getReq.onsuccess = () => {
        const cached = getReq.result as CachedStudent | undefined
        if (cached) {
          store.put({ ...cached, balance })
        }
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("Failed to apply synced balances"))
  })
}

export async function queueTransaction(tx: QueuedTransaction): Promise<void> {
  await runTransaction("pendingTransactions", "readwrite", (store) => {
    store.put(tx)
  })
}

export async function getPendingTransactions(): Promise<QueuedTransaction[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pendingTransactions", "readonly")
    const store = tx.objectStore("pendingTransactions")
    const request = store.getAll()
    request.onsuccess = () => {
      const items = (request.result as QueuedTransaction[]).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      resolve(items)
    }
    request.onerror = () => reject(request.error ?? new Error("Failed to read queue"))
  })
}

export async function removePendingTransactions(clientTxIds: string[]): Promise<void> {
  if (clientTxIds.length === 0) return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("pendingTransactions", "readwrite")
    const store = tx.objectStore("pendingTransactions")
    for (const id of clientTxIds) {
      store.delete(id)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("Failed to clear queue"))
  })
}

export async function getMeta(key: MetaKey): Promise<string | null> {
  const result = await runTransaction<string>("meta", "readonly", (store) => store.get(key))
  return (result as string | undefined) ?? null
}

export async function setMeta(key: MetaKey, value: string): Promise<void> {
  await runTransaction("meta", "readwrite", (store) => {
    store.put(value, key)
  })
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getMeta("deviceId")
  if (existing) return existing
  const deviceId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `device-${Date.now()}`
  await setMeta("deviceId", deviceId)
  return deviceId
}
