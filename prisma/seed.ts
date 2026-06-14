import bcrypt from "bcryptjs"
import {
  PrismaClient,
  AllergySeverity,
  AllergySubmissionStatus,
  NotificationType,
  UserRole,
  UserStatus,
} from "@prisma/client"
import {
  demoCalendarEvents,
  demoCalendarSettings,
  demoUsers,
} from "../src/data/demo"
import { demoMealTemplates } from "../src/data/demo/meal-templates"

const prisma = new PrismaClient()

/** Default password for all seeded portal accounts (change after first login). */
const DEFAULT_PASSWORD = "FuelTheDons2026!"

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  const school = await prisma.school.upsert({
    where: { slug: "madonna-high-school" },
    update: {
      name: "Madonna High School",
      primaryColor: "#001E62",
      secondaryColor: "#C8CDD7",
    },
    create: {
      name: "Madonna High School",
      slug: "madonna-high-school",
      primaryColor: "#001E62",
      secondaryColor: "#C8CDD7",
    },
  })

  console.log("School ID (set SCHOOL_ID on Vercel):", school.id)

  for (const user of demoUsers) {
    const badgeId =
      user.role === "parent" ? null : user.badgeId?.trim() ? user.badgeId.trim() : null

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        username: user.username.toLowerCase(),
        firstName: user.firstName,
        lastName: user.lastName,
        role:
          user.role === "admin"
            ? UserRole.ADMIN
            : user.role === "cashier"
              ? UserRole.CASHIER
              : user.role === "parent"
                ? UserRole.PARENT
                : UserRole.STAFF,
        status: user.status === "disabled" ? UserStatus.DISABLED : UserStatus.ACTIVE,
        phone: user.phone,
        badgeId,
        linkedStudentIds: user.linkedStudentIds ?? [],
        passwordHash,
        schoolId: school.id,
      },
      create: {
        username: user.username.toLowerCase(),
        email: user.email.toLowerCase(),
        firstName: user.firstName,
        lastName: user.lastName,
        role:
          user.role === "admin"
            ? UserRole.ADMIN
            : user.role === "cashier"
              ? UserRole.CASHIER
              : user.role === "parent"
                ? UserRole.PARENT
                : UserRole.STAFF,
        status: user.status === "disabled" ? UserStatus.DISABLED : UserStatus.ACTIVE,
        phone: user.phone,
        badgeId,
        linkedStudentIds: user.linkedStudentIds ?? [],
        passwordHash,
        schoolId: school.id,
      },
    })
  }

  const parent = await prisma.parent.upsert({
    where: { email: "sarah.anderson@email.com" },
    update: { name: "Sarah Anderson", phone: "555-0201" },
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
      photo:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
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
      photo:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
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
      externalId: "10459",
      firstName: "Michael",
      lastName: "Anderson",
      grade: "5",
      homeroom: "5C",
      balance: 0,
      photo:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
      allergies: [{ name: "Egg", severity: AllergySeverity.INFORMATIONAL }],
      profile: {
        dietaryRestrictions: [],
        allergyVerified: true,
        allergyReviewedAt: new Date(Date.now() - 370 * 24 * 60 * 60 * 1000),
        allergyExpiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
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
    const { allergies, profile, dietaryRestrictions, photo, ...studentFields } = data as typeof data & {
      dietaryRestrictions?: string[]
      photo?: string
      profile?: {
        dietaryRestrictions: string[]
        allergyVerified: boolean
        allergyReviewedAt: Date
        allergyExpiresAt: Date
      }
    }

    const student = await prisma.student.upsert({
      where: { schoolId_externalId: { schoolId: school.id, externalId: data.externalId } },
      update: { balance: studentFields.balance, photo },
      create: {
        ...studentFields,
        photo,
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
          crossContact: {
            avoidSharedEquipment: true,
            traceAmountsTrigger: false,
            ingredientOnly: false,
          },
          dietaryRestrictions: ["Vegetarian", "Dairy Free"],
          consentConfirmed: true,
          electronicSignature: "Sarah Anderson",
          signatureDate: new Date().toISOString().slice(0, 10),
        },
      },
    })

    await prisma.medicalDocument.deleteMany({ where: { studentId: emma.id } })
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
    await prisma.medicalDocument.deleteMany({ where: { studentId: james.id } })
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
    })
  }

  await prisma.calendarSettings.upsert({
    where: { schoolId: school.id },
    update: {
      headerTitle: demoCalendarSettings.headerTitle,
      bannerMessage: demoCalendarSettings.bannerMessage,
      accentColor: demoCalendarSettings.accentColor,
      schoolName: demoCalendarSettings.schoolName,
    },
    create: {
      schoolId: school.id,
      headerTitle: demoCalendarSettings.headerTitle,
      bannerMessage: demoCalendarSettings.bannerMessage,
      accentColor: demoCalendarSettings.accentColor,
      schoolName: demoCalendarSettings.schoolName,
    },
  })

  await prisma.calendarEvent.deleteMany({ where: { schoolId: school.id } })
  for (const event of demoCalendarEvents) {
    await prisma.calendarEvent.create({
      data: {
        title: event.title,
        date: new Date(`${event.date}T12:00:00.000Z`),
        description: event.description,
        category: event.category,
        color: event.color,
        schoolId: school.id,
      },
    })
  }

  await prisma.inventoryItem.deleteMany({ where: { schoolId: school.id } })
  await prisma.inventoryItem.createMany({
    data: [
      {
        name: "Chocolate Milk",
        qty: 24,
        unit: "cartons",
        cost: 0.65,
        expiration: new Date("2026-05-18"),
        category: "Dairy",
        schoolId: school.id,
      },
      {
        name: "Chicken Patties",
        qty: 8,
        unit: "cases",
        cost: 42.5,
        expiration: new Date("2026-06-10"),
        category: "Frozen",
        schoolId: school.id,
      },
    ],
  })

  const ethan = await prisma.student.findFirst({
    where: { externalId: "1002", schoolId: school.id },
  })

  if (ethan) {
    await prisma.notification.deleteMany({ where: { schoolId: school.id } })
    await prisma.notification.create({
      data: {
        type: NotificationType.LOW_BALANCE,
        message: "Balance below $10 — consider adding funds.",
        schoolId: school.id,
        studentId: ethan.id,
      },
    })
  }

  if (james) {
    await prisma.auditLog.create({
      data: {
        action: "ALLERGY_PROFILE_APPROVED",
        entity: "student_profile",
        entityType: "student_profile",
        entityId: james.externalId,
        performedBy: "Nutrition Office",
        metadata: { reviewedBy: "Nutrition Office", allergies: ["Peanut", "Tree Nut"] },
        schoolId: school.id,
      },
    })
  }

  await prisma.mealPhoto.deleteMany({
    where: { mealTemplate: { schoolId: school.id } },
  })
  await prisma.mealTemplateItem.deleteMany({
    where: { mealTemplate: { schoolId: school.id } },
  })
  await prisma.mealTemplate.deleteMany({ where: { schoolId: school.id } })

  for (const template of demoMealTemplates) {
    await prisma.mealTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        category: template.category,
        mealType: template.mealType,
        allergens: template.allergens,
        nutritionNotes: template.nutritionNotes,
        portionNotes: template.portionNotes,
        gradeAvailability: template.gradeAvailability,
        isFavorite: template.isFavorite,
        isPublished: template.isPublished,
        isArchived: template.isArchived,
        lastUsedAt: template.lastUsedAt ? new Date(template.lastUsedAt) : null,
        studentMealPrice: template.studentMealPrice,
        alaCartePrice: template.alaCartePrice,
        staffMealPrice: template.staffMealPrice,
        schoolId: school.id,
        items: {
          create: template.items.map((item) => ({
            name: item.name,
            sortOrder: item.sortOrder,
          })),
        },
        photos: {
          create: template.photos.map((photo) => ({
            slot: photo.slot,
            url: photo.url,
          })),
        },
      },
    })
  }

  console.log("Seed completed for", school.name)
  console.log("Default portal password for all seeded users:", DEFAULT_PASSWORD)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
