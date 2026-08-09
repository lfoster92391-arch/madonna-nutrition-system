/** Best-effort client IP / UA extraction behind Vercel / reverse proxies. */

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  if (forwarded) return forwarded.slice(0, 64)
  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp.slice(0, 64)
  return "unknown"
}

export function getUserAgent(request: Request): string {
  return (request.headers.get("user-agent") ?? "unknown").slice(0, 300)
}

/** Stable-ish device fingerprint for new admin login alerts (not cryptographic). */
export function deviceFingerprint(ip: string, userAgent: string): string {
  const raw = `${ip}|${userAgent}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0
  }
  return `fp_${hash.toString(16)}`
}