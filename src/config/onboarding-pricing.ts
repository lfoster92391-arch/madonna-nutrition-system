/** Regular student/staff lunch (Pizza Day stays $1/slice). */
export const STUDENT_LUNCH_PRICE = 7

/** Milk and juice extras (kiosk, cashier, parent milk/juice orders). */
export const MILK_JUICE_PRICE = 1

export const DEFAULT_ONBOARDING_PRICING = {
  mainMealPrice: STUDENT_LUNCH_PRICE,
  sideMealPrice: 2.0,
  alaCartePrice: 4.5,
  milkPrice: MILK_JUICE_PRICE,
  juicePrice: MILK_JUICE_PRICE,
  agreementText:
    "Madonna High School Food Services Agreement - Parents maintain accurate dietary info and current cafeteria balances.",
  emergencyPolicyText:
    "Emergency Policy - Staff follow approved allergy care plans and contact guardians immediately.",
} as const

export const LUNCH_AGREEMENT_STORAGE_KEY = "madonna-lunch-agreements"
