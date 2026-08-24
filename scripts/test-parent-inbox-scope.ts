/**
 * Parent inbox scoping assertions (no test runner required).
 *   npx tsx scripts/test-parent-inbox-scope.ts
 */
import {
  filterNotificationsForParent,
  isInboxAlertForLinkedChild,
} from "../src/lib/parent/inbox-scope"

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

const parentA = "user-parent-a"
const parentB = "user-parent-b"
const childADb = "stu-db-a"
const childAExt = "10457"
const childBDb = "stu-db-b"
const childBExt = "20999"

const linkedDb = new Set([childADb])
const linkedExt = new Set([childAExt])

const mixed = [
  {
    id: "1",
    userId: parentA,
    studentId: childADb,
    studentExternalId: childAExt,
  },
  {
    id: "2",
    userId: parentA,
    studentId: childBDb,
    studentExternalId: childBExt,
  },
  {
    id: "3",
    userId: parentB,
    studentId: childBDb,
    studentExternalId: childBExt,
  },
  {
    id: "4",
    userId: parentA,
    studentId: null,
    studentExternalId: null,
  },
  {
    id: "5",
    userId: null,
    studentId: childADb,
    studentExternalId: childAExt,
  },
]

const scoped = filterNotificationsForParent({
  sessionUserId: parentA,
  linkedStudentDbIds: linkedDb,
  linkedStudentExternalIds: linkedExt,
  notifications: mixed,
})

const ids = scoped.map((n) => n.id).sort()
assert(ids.join(",") === "1,4", `parent A should only see own+linked; got ${ids.join(",")}`)

assert(
  !scoped.some((n) => n.userId === parentB),
  "parent A must never receive parent B notifications"
)
assert(
  !scoped.some((n) => n.studentExternalId === childBExt),
  "parent A must not see another family's student alert"
)

assert(
  isInboxAlertForLinkedChild({
    studentExternalId: childAExt,
    linkedStudentExternalIds: linkedExt,
  }),
  "linked child allowed"
)
assert(
  !isInboxAlertForLinkedChild({
    studentExternalId: childBExt,
    linkedStudentExternalIds: linkedExt,
  }),
  "unlinked child blocked"
)
assert(
  isInboxAlertForLinkedChild({
    studentExternalId: null,
    linkedStudentExternalIds: linkedExt,
  }),
  "account-level notice allowed"
)

// Empty links (admin parent-preview): only null-student rows for that user
const adminScoped = filterNotificationsForParent({
  sessionUserId: parentA,
  linkedStudentDbIds: new Set(),
  linkedStudentExternalIds: new Set(),
  notifications: mixed,
})
assert(
  adminScoped.map((n) => n.id).join(",") === "4",
  "no linked children ⇒ no other kids' PII"
)

console.log("parent-inbox-scope checks passed")
