import bcrypt from "bcryptjs"
import {
  PrismaClient,
  AllergySeverity,
  AllergySubmissionStatus,
  NotificationType,
  UserRole,
  UserStatus,
} from "@prisma/client"
import { demoCalendarSettings, demoUsers } from "../src/data/demo"
import { DEMO_STUDENT_EXTERNAL_IDS } from "../src/config/demo-students"
import { DEFAULT_AGREEMENT_CONTENT } from "../src/config/agreement-defaults"

const prisma = new PrismaClient()

/** Default password for all seeded portal accounts (change after first login). */
const DEFAULT_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "FuelTheDons2026!"

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/\s+/g, "")
}

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
        username: normalizeUsername(user.username),
        firstName: user.firstName,
        lastName: user.lastName,
        role:
          user.role === "admin"
            ? UserRole.ADMIN
            : user.role === "cashier"
              ? UserRole.CASHIER
              : user.role === "parent"
                ? UserRole.PARENT
                : user.role === "teacher"
                  ? UserRole.TEACHER
                  : UserRole.STAFF,
        status: user.status === "disabled" ? UserStatus.DISABLED : UserStatus.ACTIVE,
        phone: user.phone,
        badgeId,
        department: user.department,
        accountBalance: user.accountBalance ?? 0,
        linkedStudentIds: user.linkedStudentIds ?? [],
        passwordHash,
        schoolId: school.id,
      },
      create: {
        username: normalizeUsername(user.username),
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
                : user.role === "teacher"
                  ? UserRole.TEACHER
                  : UserRole.STAFF,
        status: user.status === "disabled" ? UserStatus.DISABLED : UserStatus.ACTIVE,
        phone: user.phone,
        badgeId,
        department: user.department,
        accountBalance: user.accountBalance ?? 0,
        linkedStudentIds: user.linkedStudentIds ?? [],
        passwordHash,
        schoolId: school.id,
      },
    })
  }

  const lisaAdminPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
  await prisma.user.upsert({
    where: { email: "lisa.morris@madonnahs.org" },
    update: {
      username: "itlisa",
      firstName: "Lisa",
      lastName: "Morris",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      badgeId: "90010",
      phone: "555-1010",
      passwordHash: lisaAdminPasswordHash,
      mustChangePassword: false,
      linkedStudentIds: [],
      schoolId: school.id,
    },
    create: {
      username: "itlisa",
      email: "lisa.morris@madonnahs.org",
      firstName: "Lisa",
      lastName: "Morris",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      badgeId: "90010",
      phone: "555-1010",
      passwordHash: lisaAdminPasswordHash,
      mustChangePassword: false,
      schoolId: school.id,
    },
  })

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
      update: {
        balance: studentFields.balance,
        photo,
        disabled: DEMO_STUDENT_EXTERNAL_IDS.includes(
          data.externalId as (typeof DEMO_STUDENT_EXTERNAL_IDS)[number]
        ),
      },
      create: {
        ...studentFields,
        photo,
        dietaryRestrictions: dietaryRestrictions ?? [],
        disabled: DEMO_STUDENT_EXTERNAL_IDS.includes(
          data.externalId as (typeof DEMO_STUDENT_EXTERNAL_IDS)[number]
        ),
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

  await prisma.student.updateMany({
    where: {
      schoolId: school.id,
      externalId: { in: [...DEMO_STUDENT_EXTERNAL_IDS] },
    },
    data: { disabled: true },
  })

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
  await prisma.productionOrder.deleteMany({ where: { schoolId: school.id } })
  await prisma.mealPhoto.deleteMany({
    where: { mealTemplate: { schoolId: school.id } },
  })
  await prisma.mealTemplateItem.deleteMany({
    where: { mealTemplate: { schoolId: school.id } },
  })
  await prisma.mealTemplate.deleteMany({ where: { schoolId: school.id } })

  await prisma.inventoryItem.deleteMany({ where: { schoolId: school.id } })
  await prisma.inventoryMovement.deleteMany({ where: { schoolId: school.id } })
  await prisma.receivingRecord.deleteMany({ where: { schoolId: school.id } })
  await prisma.receiptScan.deleteMany({ where: { schoolId: school.id } })
  await prisma.storageLocation.deleteMany({ where: { schoolId: school.id } })

  const storageLocations = await Promise.all([
    prisma.storageLocation.create({
      data: { name: "Dry Storage A", zone: "dry", capacity: 200, schoolId: school.id },
    }),
    prisma.storageLocation.create({
      data: { name: "Walk-in Cooler", zone: "cold", capacity: 80, schoolId: school.id },
    }),
    prisma.storageLocation.create({
      data: { name: "Main Freezer", zone: "freezer", capacity: 60, schoolId: school.id },
    }),
    prisma.storageLocation.create({
      data: { name: "Prep Line", zone: "prep", capacity: 40, schoolId: school.id },
    }),
  ])

  const [dryLoc, coldLoc, freezerLoc] = storageLocations

  const invMilk = await prisma.inventoryItem.create({
    data: {
      name: "Chocolate Milk",
      qty: 24,
      unit: "cartons",
      cost: 0.65,
      expiration: new Date("2026-05-18"),
      category: "Dairy",
      barcode: "041000000001",
      storageLocationId: coldLoc.id,
      schoolId: school.id,
    },
  })

  const invChicken = await prisma.inventoryItem.create({
    data: {
      name: "Chicken Patties",
      qty: 8,
      unit: "cases",
      cost: 42.5,
      expiration: new Date("2026-06-10"),
      category: "Frozen",
      lowStockThreshold: 12,
      barcode: "041000000002",
      storageLocationId: freezerLoc.id,
      schoolId: school.id,
    },
  })

  await prisma.inventoryItem.createMany({
    data: [
      {
        name: "Apple Slices",
        qty: 42,
        unit: "bags",
        cost: 3.25,
        expiration: new Date("2026-05-14"),
        category: "Produce",
        storageLocationId: coldLoc.id,
        schoolId: school.id,
      },
      {
        name: "Hamburger Buns",
        qty: 60,
        unit: "packs",
        cost: 2.15,
        expiration: new Date("2026-05-13"),
        category: "Bakery",
        storageLocationId: dryLoc.id,
        schoolId: school.id,
      },
    ],
  })

  const receivingApproved = await prisma.receivingRecord.create({
    data: {
      vendorName: "Local Produce Co.",
      status: "approved",
      lines: [
        { inventoryItemId: invMilk.id, name: "Chocolate Milk", quantity: 24, unit: "cartons" },
      ],
      receivedAt: new Date("2026-06-12T09:15:00.000Z"),
      approvedAt: new Date("2026-06-12T10:00:00.000Z"),
      approvedBy: "Nutrition Office",
      schoolId: school.id,
    },
  })

  const receivingPending = await prisma.receivingRecord.create({
    data: {
      vendorName: "Sysco Foods",
      invoiceNumber: "INV-88421",
      status: "pending_approval",
      lines: [
        { inventoryItemId: invChicken.id, name: "Chicken Breast", quantity: 40, unit: "lb", unitCost: 2.85 },
        { name: "Whole Wheat Buns", quantity: 120, unit: "ea", unitCost: 0.35 },
      ],
      receivedAt: new Date("2026-06-13T14:30:00.000Z"),
      schoolId: school.id,
    },
  })

  await prisma.inventoryMovement.create({
    data: {
      type: "receive",
      quantity: 24,
      note: "Local Produce delivery",
      inventoryItemId: invMilk.id,
      storageLocationId: coldLoc.id,
      receivingRecordId: receivingApproved.id,
      schoolId: school.id,
      createdBy: "Kitchen Staff",
    },
  })

  await prisma.receiptScan.createMany({
    data: [
      {
        fileName: "sysco-june-13.pdf",
        vendorGuess: "Sysco Foods",
        ocrText: "SYSCO FOODS\nInvoice INV-88421\nChicken Breast 40 lb",
        status: "matched",
        matchedReceivingId: receivingPending.id,
        schoolId: school.id,
      },
      {
        fileName: "unknown-vendor.jpg",
        ocrText: "Receipt unreadable — manual review required",
        status: "unmatched",
        schoolId: school.id,
      },
    ],
  })

  const todayProd = new Date()
  todayProd.setHours(11, 0, 0, 0)

  await prisma.productionOrder.createMany({
    data: [
      {
        title: "Wednesday Salad Bar",
        status: "planned",
        scheduledFor: new Date(todayProd.getTime() + 86400000),
        portionsPlanned: 160,
        portionsMade: 0,
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

  const teacherUser = await prisma.user.findUnique({
    where: { email: "m.anderson@weirtonmadonna.org" },
  })

  if (teacherUser) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    await prisma.teacherLunchReservation.upsert({
      where: { userId_date: { userId: teacherUser.id, date: today } },
      update: {},
      create: {
        userId: teacherUser.id,
        schoolId: school.id,
        date: today,
        mealName: "Grilled Chicken Plate",
        mealPrice: 5.25,
        mealPhotoUrl:
          "https://images.unsplash.com/photo-1604908176997-431cef8a0b38?q=80&w=400&auto=format&fit=crop",
        paymentMethod: "ACCOUNT",
        status: "RESERVED",
      },
    })
  }

  await prisma.onboardingPricing.upsert({
    where: { schoolId: school.id },
    update: {},
    create: {
      schoolId: school.id,
      mainMealPrice: 3.0,
      sideMealPrice: 2.0,
      alaCartePrice: 4.5,
      milkPrice: 0.75,
      agreementText:
        "Madonna High School Food Services Agreement — parents maintain accurate dietary info and current cafeteria balances.",
      emergencyPolicyText:
        "Emergency Policy — staff follow approved allergy care plans and contact guardians immediately.",
    },
  })

  await prisma.agreementVersion.upsert({
    where: { schoolId_versionNumber: { schoolId: school.id, versionNumber: 1 } },
    update: {
      status: "PUBLISHED",
      content: DEFAULT_AGREEMENT_CONTENT,
    },
    create: {
      schoolId: school.id,
      versionLabel: "V1",
      versionNumber: 1,
      status: "PUBLISHED",
      effectiveDate: new Date("2025-08-01"),
      expiresAt: new Date("2026-07-31"),
      content: DEFAULT_AGREEMENT_CONTENT,
      publishedAt: new Date(),
      publishedBy: "seed",
    },
  })

  console.log("Seed completed for", school.name)
  console.log("Lisa Morris admin login username: itlisa")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
