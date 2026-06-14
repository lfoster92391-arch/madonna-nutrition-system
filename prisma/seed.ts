import {
  PrismaClient,
  AllergySeverity,
  AllergySubmissionStatus,
  NotificationType,
  UserRole,
} from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const school = await prisma.school.upsert({
    where: { slug: "madonna-academy" },
    update: {},
    create: {
      name: "Madonna Academy",
      slug: "madonna-academy",
      primaryColor: "#001E62",
      secondaryColor: "#C8CDD7",
    },
  })

  await prisma.user.upsert({
    where: { email: "admin@madonna.academy.edu" },
    update: {},
    create: {
      email: "admin@madonna.academy.edu",
      name: "System Admin",
      role: UserRole.ADMIN,
      schoolId: school.id,
    },
  })

  const parent = await prisma.parent.upsert({
    where: { email: "sarah.anderson@email.com" },
    update: {},
    create: {
      email: "sarah.anderson@email.com",
      name: "Sarah Anderson",
      phone: "555-0201",
    },
  })

  const studentData = [
    {
      externalId: "10457",
      firstName: "James",
      lastName: "Anderson",
      grade: "10",
      homeroom: "10B",
      balance: 12.45,
      allergies: [
        { name: "Peanut", severity: AllergySeverity.SEVERE },
        { name: "Tree Nut", severity: AllergySeverity.SEVERE },
      ],
      profile: {
        dietaryRestrictions: [],
        allergyVerified: true,
        allergyReviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        allergyExpiresAt: new Date(Date.now() + 357 * 24 * 60 * 60 * 1000),
      },
    },
    {
      externalId: "10458",
      firstName: "Emma",
      lastName: "Anderson",
      grade: "8",
      homeroom: "8A",
      balance: 36.3,
      allergies: [{ name: "Dairy", severity: AllergySeverity.MODERATE }],
      dietaryRestrictions: ["Vegetarian"],
      profile: {
        dietaryRestrictions: ["Vegetarian"],
        allergyVerified: true,
        allergyReviewedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        allergyExpiresAt: new Date(Date.now() + 245 * 24 * 60 * 60 * 1000),
      },
    },
    {
      externalId: "1001",
      firstName: "Sophia",
      lastName: "Martinez",
      grade: "10",
      homeroom: "10A",
      balance: 12.5,
      allergies: [{ name: "Peanuts", severity: AllergySeverity.SEVERE }],
    },
    {
      externalId: "1002",
      firstName: "Ethan",
      lastName: "Walker",
      grade: "11",
      homeroom: "11B",
      balance: 8.25,
      allergies: [],
    },
    {
      externalId: "1003",
      firstName: "Ava",
      lastName: "Johnson",
      grade: "9",
      homeroom: "9C",
      balance: -2.5,
      allergies: [{ name: "Dairy", severity: AllergySeverity.MODERATE }],
    },
  ]

  for (const data of studentData) {
    const { allergies, profile, dietaryRestrictions, ...studentFields } = data as typeof data & {
      dietaryRestrictions?: string[]
      profile?: {
        dietaryRestrictions: string[]
        allergyVerified: boolean
        allergyReviewedAt: Date
        allergyExpiresAt: Date
      }
    }

    const student = await prisma.student.upsert({
      where: { schoolId_externalId: { schoolId: school.id, externalId: data.externalId } },
      update: { balance: studentFields.balance },
      create: {
        ...studentFields,
        dietaryRestrictions: dietaryRestrictions ?? [],
        schoolId: school.id,
      },
    })

    await prisma.allergy.deleteMany({ where: { studentId: student.id } })
    for (const allergy of allergies) {
      await prisma.allergy.create({
        data: { ...allergy, studentId: student.id },
      })
    }

    if (profile) {
      await prisma.studentProfile.upsert({
        where: { studentId: student.id },
        update: profile,
        create: { ...profile, studentId: student.id },
      })
    }

    if (["10457", "10458", "10459"].includes(data.externalId)) {
      await prisma.parentStudent.upsert({
        where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
        update: {},
        create: { parentId: parent.id, studentId: student.id, relationship: "Mother" },
      })
    }
  }

  const emma = await prisma.student.findFirst({
    where: { externalId: "10458", schoolId: school.id },
  })

  if (emma) {
    await prisma.allergySubmission.upsert({
      where: { id: "seed-sub-emma-001" },
      update: {},
      create: {
        id: "seed-sub-emma-001",
        studentId: emma.id,
        submittedBy: "Sarah Anderson",
        status: AllergySubmissionStatus.PENDING_REVIEW,
        changePayload: {
          allergies: ["Dairy", "Soy"],
          severity: "moderate",
          crossContact: { avoidSharedEquipment: true, traceAmountsTrigger: false, ingredientOnly: false },
          dietaryRestrictions: ["Vegetarian", "Dairy Free"],
          consentConfirmed: true,
          electronicSignature: "Sarah Anderson",
          signatureDate: new Date().toISOString().slice(0, 10),
        },
      },
    })

    await prisma.medicalDocument.create({
      data: {
        studentId: emma.id,
        documentUrl: "https://example.com/demo/emma-doctor-note.pdf",
        fileName: "Emma_Doctor_Note.pdf",
        version: 1,
        uploadedBy: "Sarah Anderson",
      },
    })
  }

  const james = await prisma.student.findFirst({
    where: { externalId: "10457", schoolId: school.id },
  })

  if (james) {
    await prisma.medicalDocument.createMany({
      data: [
        {
          studentId: james.id,
          documentUrl: "https://example.com/demo/james-action-plan-v1.pdf",
          fileName: "James_Allergy_Action_Plan.pdf",
          version: 1,
          uploadedBy: "Sarah Anderson",
        },
        {
          studentId: james.id,
          documentUrl: "https://example.com/demo/james-epipen-v2.pdf",
          fileName: "James_EpiPen_Prescription.pdf",
          version: 2,
          uploadedBy: "Sarah Anderson",
        },
      ],
      skipDuplicates: true,
    })
  }

  const inventoryItems = [
    { name: "Chocolate Milk", qty: 24, unit: "cartons", cost: 0.65, expiration: new Date("2026-05-18"), category: "Dairy" },
    { name: "Chicken Patties", qty: 8, unit: "cases", cost: 42.5, expiration: new Date("2026-06-10"), category: "Frozen" },
  ]

  for (const item of inventoryItems) {
    await prisma.inventoryItem.create({ data: { ...item, schoolId: school.id } })
  }

  await prisma.notification.create({
    data: {
      type: NotificationType.LOW_BALANCE,
      message: "Balance below $10 — consider adding funds.",
      schoolId: school.id,
      studentId: (await prisma.student.findFirst({ where: { externalId: "1002" } }))!.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: "ALLERGY_PROFILE_APPROVED",
      entity: "student_profile",
      entityId: james?.id,
      metadata: { reviewedBy: "Nutrition Office", allergies: ["Peanut", "Tree Nut"] },
      schoolId: school.id,
    },
  })

  console.log("Seed completed for", school.name)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
