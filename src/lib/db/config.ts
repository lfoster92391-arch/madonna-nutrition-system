export function isDatabaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

export function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    throw new Error("DATABASE_URL is not configured")
  }
}
