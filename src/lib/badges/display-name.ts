/** First + optional middle + last on a single printable badge line. */
export function badgeFullName(
  firstName?: string | null,
  lastName?: string | null,
  middleName?: string | null
): string {
  const name = [firstName, middleName, lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ")
  return name || "—"
}
