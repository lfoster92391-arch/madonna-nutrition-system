export const DEFAULT_ONBOARDING_PRICING = {
  mainMealPrice: 7.0,
  sideMealPrice: 3.0,
  alaCartePrice: 1.0,
  milkPrice: 1.0,
  agreementText:
    "Madonna High School Food Services Agreement - Parents maintain accurate dietary info and current cafeteria balances.",
  emergencyPolicyText:
    "Emergency Policy - Staff follow approved allergy care plans and contact guardians immediately.",
} as const

export const LUNCH_AGREEMENT_STORAGE_KEY = "madonna-lunch-agreements"