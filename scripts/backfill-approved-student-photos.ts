/**
 * One-time: mark existing on-file student photos as APPROVED for badge print.
 *
 * Safe for school-uploaded / roster photos that never went through parent
 * moderation (photoStatus stayed NONE after PR #70). Does not touch PENDING
 * or DENIED parent uploads.
 *
 * Usage (point DATABASE_URL / DIRECT_URL at the target DB first):
 *   npm run db:backfill-approved-photos
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/** Same stock placeholders the app injects when no real photo is on file. */
const PLACEHOLDER_HINTS = [
  "images.unsplash.com/photo-1535713875002-d1d0cf377fde",
  "images.unsplash.com/photo-1604908176997-431cef8a0b38",
]

function isRealPhoto(photo: string | null): boolean {
  if (!photo?.trim()) return false
  return !PLACEHOLDER_HINTS.some((hint) => photo.includes(hint))
}

async function main() {
  const candidates = await prisma.student.findMany({
    where: { photoStatus: "NONE" },
    select: {
      id: true,
      externalId: true,
      firstName: true,
      lastName: true,
      photo: true,
    },
  })

  const toApprove = candidates.filter((s) => isRealPhoto(s.photo))
  if (toApprove.length === 0) {
    console.log("No NONE-status students with a real photo to approve.")
    return
  }

  const result = await prisma.student.updateMany({
    where: { id: { in: toApprove.map((s) => s.id) } },
    data: { photoStatus: "APPROVED" },
  })

  console.log(
    `Approved ${result.count} student photo(s) that were on file with status NONE.`
  )
  for (const s of toApprove.slice(0, 40)) {
    console.log(`  ${s.externalId} — ${s.firstName} ${s.lastName}`)
  }
  if (toApprove.length > 40) {
    console.log(`  … and ${toApprove.length - 40} more`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
