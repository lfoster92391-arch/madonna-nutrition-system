import { z } from "zod"

export const ADD_FUNDS_MIN = 5
export const ADD_FUNDS_MAX = 500
export const PRESET_AMOUNTS = [10, 25, 50] as const

export const createCheckoutSessionSchema = z.object({
  studentId: z.string().min(1),
  parentUserId: z.string().min(1),
  amountDollars: z
    .number()
    .min(ADD_FUNDS_MIN, `Minimum amount is $${ADD_FUNDS_MIN}`)
    .max(ADD_FUNDS_MAX, `Maximum amount is $${ADD_FUNDS_MAX}`),
})

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>
