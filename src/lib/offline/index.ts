export {
  applySyncedBalances,
  cacheStudents,
  cachedToStudent,
  findCachedStudent,
  getMeta,
  getOrCreateDeviceId,
  getPendingTransactions,
  queueTransaction,
  removePendingTransactions,
  setMeta,
  studentToCached,
  updateCachedStudentBalance,
  type CachedStudent,
  type QueuedTransaction,
} from "./scan-offline-db"

export {
  createQueuedTransaction,
  isBrowserOnline,
  isNetworkError,
  offlineReasonFromError,
  probeServerReachable,
  refreshStudentCache,
  refreshStudentCacheFromServer,
  syncPendingTransactions,
  type OfflineReason,
  type SyncResult,
} from "./sync-manager"
