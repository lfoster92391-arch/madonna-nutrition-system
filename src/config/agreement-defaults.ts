export interface AgreementContent {
  mealSignUpPolicy: string
  pricing: {
    mainMeal: number
    premiumSides: number
    lightMeal: number
    drinks: number
  }
  responsibilities: string
}

export const DEFAULT_AGREEMENT_CONTENT: AgreementContent = {
  mealSignUpPolicy: `Lunch Reservation Requirement

All students participating in the Fuel The Dons cafeteria program must have a signed digital cafeteria agreement on file before meal reservations or purchases are permitted. Parents and guardians must complete this agreement electronically prior to the first lunch sign-up each school year.

By enrolling in cafeteria services, you acknowledge and agree to the following:

• Meal reservations must be submitted through the parent portal by the published deadline (typically 48 hours before the service date). Unreserved meals may not be guaranteed.

• Students without a current signed agreement on file will not be permitted to sign up for or receive cafeteria meals until the agreement is completed.

• Account balances must remain current. Low-balance and negative-balance notifications are sent automatically through the platform.

• Allergy, dietary restriction, and emergency contact information must be kept accurate and up to date in the parent portal at all times.

• The school will make reasonable efforts to accommodate documented dietary needs entered into the system, but cannot guarantee substitutions for unreserved or walk-in meals.

• Meal charges are posted at the cafeteria kiosk and visible in the parent portal. Parents are responsible for reviewing charges and transaction history regularly.

• Failure to maintain a signed agreement, current balance, or accurate student profile may result in suspension of cafeteria privileges until resolved.`,
  pricing: {
    mainMeal: 3,
    premiumSides: 2,
    lightMeal: 1,
    drinks: 1,
  },
  responsibilities: `Parent / Guardian Responsibilities

By signing this agreement, I confirm that I have read, understand, and agree to:

☐ Submit meal reservations on time through the Fuel The Dons parent portal
☐ Maintain accurate allergy and dietary information for each enrolled student
☐ Keep cafeteria account balances funded and respond to low-balance alerts promptly
☐ Review meal charges and transaction history in the parent portal
☐ Notify the school immediately of any changes to emergency contact information
☐ Understand that unsigned or expired agreements block lunch enrollment until renewed
☐ Accept responsibility for meal charges incurred while this agreement is in effect`,
}

export const AGREEMENT_DEMO_STORAGE_KEY = "madonna-agreement-signatures-v2"
export const AGREEMENT_DEMO_VERSIONS_KEY = "madonna-agreement-versions-v1"

export const DEFAULT_PUBLISHED_VERSION = {
  id: "demo-agreement-v1",
  versionLabel: "V1",
  versionNumber: 1,
  status: "PUBLISHED" as const,
  effectiveDate: new Date("2025-08-01").toISOString(),
  expiresAt: new Date("2026-07-31").toISOString(),
  content: DEFAULT_AGREEMENT_CONTENT,
}
