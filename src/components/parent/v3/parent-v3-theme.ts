/** Parent Experience V3 — presentation tokens */
export const V3_NAVY = "#041B52"
export const V3_NAVY_ALT = "#0A1E3F"
export const V3_SILVER = "#C7CCD6"
export const V3_CARD =
  "rounded-[16px] border bg-white shadow-none"
export const V3_CARD_BORDER = "border-[#C7CCD6]"
export const V3_PAGE_PAD = "px-6 py-6 md:px-8 md:py-8"
export const V3_SECTION_GAP = "space-y-6 md:space-y-8"
export const V3_MAX_WIDTH = "mx-auto w-full max-w-6xl"

export type ParentDrawerId = "add-funds" | "meal-activity" | "alerts" | "settings" | null

export const PARENT_DRAWER_PARAM = "drawer"
export const PARENT_STUDENT_PARAM = "student"

export function parseParentDrawer(value: string | null): ParentDrawerId {
  if (
    value === "add-funds" ||
    value === "meal-activity" ||
    value === "alerts" ||
    value === "settings"
  ) {
    return value
  }
  return null
}
