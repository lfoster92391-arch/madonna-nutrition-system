/**
 * Login rate limiting + temporary lockout.
 * In-memory map (per serverless instance) plus AuditLog persistence.
 * Not a substitute for WAF / edge rate limits — defense in depth only.
 */

import { createAuditLog } from "@/lib/db/audit"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { sendSecurityAlert } from "@/lib/security/alerts"
import { isDatabaseEnabled } from "@/lib/db/config"

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES_BEFORE_LOCK = 5
const BURST_ALERT_THRESHOLD = 8
const BASE_LOCK_MS = 30_000
const MAX_LOCK_MS = 15 * 60 * 1000
const ALERT_COOLDOWN_MS = 30 * 60 * 1000

type AttemptBucket = {
  failures: number
  firstFailureAt: number
  lockedUntil: number
  lastAlertAt: number
}

const buckets = new Map<string, AttemptBucket>()

function bucketKey(ip: string, loginId: string): string {
  return `${ip}::${loginId.toLowerCase()}`
}

function getBucket(key: string): AttemptBucket {
  const existing = buckets.get(key)
  if (existing) return existing
  const fresh: AttemptBucket = {
    failures: 0,
    firstFailureAt: 0,
    lockedUntil: 0,
    lastAlertAt: 0,
  }
  buckets.set(key, fresh)
  return fresh
}

function pruneBucket(bucket: AttemptBucket, now: number) {
  if (bucket.firstFailureAt && now - bucket.firstFailureAt > WINDOW_MS) {
    bucket.failures = 0
    bucket.firstFailureAt = 0
  }
}

export type LoginThrottleResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number; message: string }

export function checkLoginAllowed(ip: string, loginId: string): LoginThrottleResult {
  const now = Date.now()
  const bucket = getBucket(bucketKey(ip, loginId))
  pruneBucket(bucket, now)

  if (bucket.lockedUntil > now) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.lockedUntil - now) / 1000))
    return {
      allowed: false,
      retryAfterSec,
      message: `Too many failed sign-in attempts. Try again in ${retryAfterSec} seconds.`,
    }
  }

  return { allowed: true }
}

export function clearLoginFailures(ip: string, loginId: string): void {
  buckets.delete(bucketKey(ip, loginId))
}

export async function recordLoginFailure(input: {
  ip: string
  loginId: string
  portalRole: string
  userAgent: string
  reason: string
}): Promise<{ locked: boolean; retryAfterSec: number; failures: number }> {
  const now = Date.now()
  const key = bucketKey(input.ip, input.loginId)
  const bucket = getBucket(key)
  pruneBucket(bucket, now)

  if (!bucket.firstFailureAt) bucket.firstFailureAt = now
  bucket.failures += 1

  let locked = false
  let retryAfterSec = 0

  if (bucket.failures >= MAX_FAILURES_BEFORE_LOCK) {
    const over = bucket.failures - MAX_FAILURES_BEFORE_LOCK
    const lockMs = Math.min(MAX_LOCK_MS, BASE_LOCK_MS * 2 ** Math.max(0, over))
    bucket.lockedUntil = now + lockMs
    locked = true
    retryAfterSec = Math.ceil(lockMs / 1000)
  }

  if (isDatabaseEnabled()) {
    try {
      await createAuditLog({
        action: "LOGIN_FAILED",
        entity: "auth",
        entityType: "auth",
        entityId: input.loginId.slice(0, 80),
        performedBy: "system",
        reason: input.reason,
        metadata: {
          ip: input.ip,
          userAgent: input.userAgent,
          portalRole: input.portalRole,
          failuresInWindow: bucket.failures,
          locked,
        },
      })
    } catch (error) {
      console.error("[login-throttle] audit log failed", error)
    }
  }

  const shouldAlert =
    bucket.failures >= BURST_ALERT_THRESHOLD &&
    (!bucket.lastAlertAt || now - bucket.lastAlertAt > ALERT_COOLDOWN_MS)

  if (shouldAlert) {
    bucket.lastAlertAt = now
    void sendSecurityAlert({
      kind: "burst_failed_logins",
      subject: `Burst failed logins (${bucket.failures})`,
      body: [
        "Multiple failed sign-in attempts were detected.",
        "",
        `Login id attempted: ${input.loginId}`,
        `Portal: ${input.portalRole}`,
        `IP: ${input.ip}`,
        `Failures in ~15 min window: ${bucket.failures}`,
        `User-Agent: ${input.userAgent}`,
        `Locked: ${locked ? "yes" : "no"}`,
        "",
        "Recommended: confirm whether this was a user typo or a brute-force attempt.",
      ].join("\n"),
      metadata: {
        ip: input.ip,
        loginId: input.loginId,
        portalRole: input.portalRole,
        failures: bucket.failures,
      },
    })
  }

  return { locked, retryAfterSec, failures: bucket.failures }
}

/** Count DB-backed failed logins for an IP in the window (cross-instance signal). */
export async function countRecentFailedLoginsByIp(ip: string): Promise<number> {
  if (!isDatabaseEnabled() || ip === "unknown") return 0
  try {
    const schoolId = await resolveSchoolId()
    const since = new Date(Date.now() - WINDOW_MS)
    const logs = await prisma.auditLog.findMany({
      where: {
        schoolId,
        action: "LOGIN_FAILED",
        createdAt: { gte: since },
      },
      select: { metadata: true },
      take: 200,
    })
    return logs.filter((log) => {
      const meta = log.metadata as { ip?: string } | null
      return meta?.ip === ip
    }).length
  } catch {
    return 0
  }
}