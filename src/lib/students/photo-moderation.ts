import type { Student } from "@/lib/types"

/** Default stock photo used when no real student photo is on file. */
const PLACEHOLDER_PHOTO_HINTS = [
  "images.unsplash.com/photo-1535713875002-d1d0cf377fde",
  "images.unsplash.com/photo-1604908176997-431cef8a0b38",
]

export type PhotoModerationStatus = NonNullable<Student["photoStatus"]>

export function studentHasRealPhoto(photo?: string | null): boolean {
  if (!photo?.trim()) return false
  return !PLACEHOLDER_PHOTO_HINTS.some((hint) => photo.includes(hint))
}

/** Photos that may appear on printed badges and the lunch kiosk. */
export function studentPhotoReadyForBadge(
  student: Pick<Student, "photo" | "photoStatus">
): boolean {
  if (!studentHasRealPhoto(student.photo)) return false
  // Legacy payloads without photoStatus: real photo was already badge-ready.
  const status = student.photoStatus ?? "approved"
  return status === "approved"
}

export function photoStatusLabel(status?: PhotoModerationStatus | null): string {
  switch (status) {
    case "pending":
      return "Pending admin review"
    case "approved":
      return "Approved for badges"
    case "denied":
      return "Denied — upload a new photo"
    case "none":
    default:
      return "No photo on file"
  }
}
