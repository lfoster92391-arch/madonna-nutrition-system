/**
 * Parent inbox scoping: notifications must belong to the session user and,
 * when student-linked, only to that parent's children.
 */

export type InboxNotificationCandidate = {
  id: string
  userId: string | null
  studentId: string | null
  studentExternalId?: string | null
}

/**
 * Keep only rows addressed to this parent. Student-scoped rows must match a
 * linked child (by DB id or external/MD id). Rows with no student (broadcasts
 * / account notices for that user) stay visible.
 */
export function filterNotificationsForParent(input: {
  sessionUserId: string
  linkedStudentDbIds: ReadonlySet<string>
  linkedStudentExternalIds: ReadonlySet<string>
  notifications: InboxNotificationCandidate[]
}): InboxNotificationCandidate[] {
  const { sessionUserId, linkedStudentDbIds, linkedStudentExternalIds, notifications } =
    input

  return notifications.filter((n) => {
    if (n.userId !== sessionUserId) return false
    if (!n.studentId) return true
    if (linkedStudentDbIds.has(n.studentId)) return true
    if (n.studentExternalId && linkedStudentExternalIds.has(n.studentExternalId)) {
      return true
    }
    return false
  })
}

/** Client-side guard: external student ids from the parent session. */
export function isInboxAlertForLinkedChild(input: {
  studentExternalId: string | null | undefined
  linkedStudentExternalIds: ReadonlySet<string>
}): boolean {
  if (!input.studentExternalId) return true
  return input.linkedStudentExternalIds.has(input.studentExternalId)
}
