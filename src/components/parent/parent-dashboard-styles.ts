/** Shared layout tokens for Parent Command Center */
export const PARENT_NAVY = "#041B52"
export const PARENT_CARD =
  "rounded-[12px] border border-[#C8CDD7] bg-white shadow-none"
export const PARENT_SECTION_GAP = "space-y-6 md:space-y-8"
export const PARENT_PAGE_PAD = "px-4 py-6 sm:px-6 md:px-8 md:py-8"

export function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}
