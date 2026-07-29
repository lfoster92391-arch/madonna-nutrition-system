import type { DesignElement, DesignPage, ElementAppearance } from "@/lib/calendar-design/types"

/** Madonna lunch calendars follow the academic year (Aug–Jun). */
export const SCHOOL_YEAR_START = 2026
export const SCHOOL_YEAR_END = 2027
export const SCHOOL_YEAR_LABEL = `${SCHOOL_YEAR_START}–${SCHOOL_YEAR_END}`

export const DEFAULT_APPEARANCE: ElementAppearance = {
  backgroundColor: "#FFF2F6",
  borderColor: "#F28CB8",
  borderRadius: 16,
  padding: 16,
  showTitle: true,
  titleStyle: "Fun Rounded",
  textColor: "#6B2C59",
  shadow: 20,
  animation: 0,
  spacing: 12,
}

function createElement(partial: Partial<DesignElement> & Pick<DesignElement, "id" | "type" | "label">): DesignElement {
  return { x: 0, y: 0, width: 100, height: 100, appearance: { ...DEFAULT_APPEARANCE }, ...partial }
}

export function createDefaultPage(month: number, year: number, themeId = "back-to-school"): DesignPage {
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  return {
    id: `page-${year}-${month}`,
    title: `${monthNames[month - 1]} ${year} Lunch Calendar`,
    month, year, themeId,
    elements: [
      createElement({ id: "el-calendar-grid", type: "calendar_grid", label: "Calendar Grid", width: 100, height: 60 }),
      createElement({ id: "el-did-you-know", type: "did_you_know", label: "Did You Know Box", width: 48, height: 18, dailyBite: { category: "food-facts", autoMatchTheme: true, rotateDaily: true, factIndex: 0 } }),
      createElement({ id: "el-staff-pick", type: "staff_pick", label: "Staff Pick Card", width: 48, height: 18, staffPick: { title: "Staff Pick of the Week", subtitle: "This week's favorite from our team", mealName: "Buffalo Chicken Wrap", staffName: "Mrs. Miller" } }),
    ],
  }
}

/** Default studio document: Aug 2026 → Jun 2027 with seasonal themes. */
export function createDefaultDocument() {
  const pages = [
    createDefaultPage(8, SCHOOL_YEAR_START, "back-to-school"),
    createDefaultPage(9, SCHOOL_YEAR_START, "back-to-school"),
    createDefaultPage(10, SCHOOL_YEAR_START, "halloween"),
    createDefaultPage(11, SCHOOL_YEAR_START, "thanksgiving"),
    createDefaultPage(12, SCHOOL_YEAR_START, "christmas-lunch"),
    createDefaultPage(1, SCHOOL_YEAR_END, "new-years"),
    createDefaultPage(2, SCHOOL_YEAR_END, "valentines-day"),
    createDefaultPage(3, SCHOOL_YEAR_END, "st-patricks-day"),
    createDefaultPage(4, SCHOOL_YEAR_END, "easter"),
    createDefaultPage(5, SCHOOL_YEAR_END, "teacher-appreciation"),
    createDefaultPage(6, SCHOOL_YEAR_END, "graduation"),
  ]
  return {
    id: "design-default",
    name: `${SCHOOL_YEAR_LABEL} Lunch Calendar`,
    pages,
    activePageId: pages[0].id,
    updatedAt: new Date().toISOString(),
  }
}

export const DEMO_CALENDAR_DAYS = [
  { day: 2, weekday: "Mon", meals: [{ name: "Chicken Alfredo", label: "lunch" }] },
  { day: 3, weekday: "Tue", meals: [{ name: "Beef Soft Tacos", label: "lunch" }] },
  { day: 4, weekday: "Wed", meals: [{ name: "Valentine's Pizza Hearts", label: "special" }] },
  { day: 5, weekday: "Thu", meals: [{ name: "Grilled Cheese & Tomato Soup", label: "lunch" }] },
  { day: 6, weekday: "Fri", meals: [{ name: "Fish Sticks & Fries", label: "lunch" }] },
  { day: 9, weekday: "Mon", meals: [{ name: "Spaghetti & Meatballs", label: "lunch" }] },
  { day: 10, weekday: "Tue", meals: [{ name: "Chicken Nuggets", label: "lunch" }] },
  { day: 11, weekday: "Wed", meals: [{ name: "NO SCHOOL", label: "no_school" }] },
  { day: 12, weekday: "Thu", meals: [{ name: "Turkey & Cheese Sub", label: "lunch" }] },
  { day: 13, weekday: "Fri", meals: [{ name: "Valentine's Cookie Lunch", label: "special" }] },
  { day: 16, weekday: "Mon", meals: [{ name: "Mac & Cheese", label: "lunch" }] },
  { day: 17, weekday: "Tue", meals: [{ name: "Teacher Appreciation Salad Bar", label: "teacher" }] },
  { day: 18, weekday: "Wed", meals: [{ name: "Pizza Day", label: "special" }] },
  { day: 19, weekday: "Thu", meals: [{ name: "Chicken Quesadilla", label: "lunch" }] },
  { day: 20, weekday: "Fri", meals: [{ name: "Hamburger & Tater Tots", label: "lunch" }] },
] as const
