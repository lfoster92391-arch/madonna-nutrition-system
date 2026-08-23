import type { Prisma } from "@prisma/client"
import { toDbAllergySeverity } from "@/lib/db/mappers"
import { addOneYear, payloadToAllergies } from "@/lib/food-safety"
import type { FoodSafetyFormPayload } from "@/lib/types"

type Tx = Prisma.TransactionClient

/** Write allergies / dietary prefs from a form payload onto the student account. */
export async function applyFoodSafetyPayloadToStudent(
  tx: Tx,
  studentId: string,
  payload: FoodSafetyFormPayload,
  now = new Date()
) {
  const allergies = payloadToAllergies(payload)
  const dietary = payload.dietaryRestrictions.filter((d) => d !== "Other")
  if (payload.otherDietaryDescription) {
    dietary.push(payload.otherDietaryDescription)
  }

  await tx.allergy.deleteMany({ where: { studentId } })
  if (allergies.length > 0) {
    await tx.allergy.createMany({
      data: allergies.map((allergy) => ({
        studentId,
        name: allergy.name,
        severity: toDbAllergySeverity(allergy.severity),
      })),
    })
  }

  await tx.student.update({
    where: { id: studentId },
    data: { dietaryRestrictions: dietary },
  })

  await tx.studentProfile.upsert({
    where: { studentId },
    update: {
      dietaryRestrictions: dietary,
      allergyVerified: true,
      allergyReviewedAt: now,
      allergyExpiresAt: new Date(addOneYear(now)),
      updateRequestedAt: null,
      medicalNotes: payload.medicalNotes ?? payload.reactionInfo ?? null,
      emergencyFoodContactName: payload.emergencyFoodContactName ?? null,
      emergencyFoodContactPhone: payload.emergencyFoodContactPhone ?? null,
    },
    create: {
      studentId,
      dietaryRestrictions: dietary,
      allergyVerified: true,
      allergyReviewedAt: now,
      allergyExpiresAt: new Date(addOneYear(now)),
      medicalNotes: payload.medicalNotes ?? payload.reactionInfo ?? null,
      emergencyFoodContactName: payload.emergencyFoodContactName ?? null,
      emergencyFoodContactPhone: payload.emergencyFoodContactPhone ?? null,
    },
  })

  return { allergies, dietary }
}
