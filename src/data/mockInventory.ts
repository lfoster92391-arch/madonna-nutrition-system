/** Cafeteria inventory list — starts empty until wired to live APIs. */
export const mockInventory: Array<{
  id: number
  itemName: string
  category: string
  quantity: number
  lowStockThreshold: number
  expirationDate: string
}> = []
