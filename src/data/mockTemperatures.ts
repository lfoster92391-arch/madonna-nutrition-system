/** Temperature checks — starts empty until wired to live APIs. */
export const mockTemperatures: Array<{
  id: number
  location: string
  temperature: number
  safeRange: string
  status: string
  lastChecked: string
}> = []
