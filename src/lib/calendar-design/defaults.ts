import type { DesignElement, DesignPage, ElementAppearance } from "@/lib/calendar-design/types"

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

export function createDefaultPage(month: number, year: number, themeId = "valentines-day"): DesignPage {
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

export function createDefaultDocument() {
  const pages = [createDefaultPage(2, 2026, "valentines-day"), createDefaultPage(3, 2026, "spring-celebration"), createDefaultPage(4, 2026, "spring-celebration"), createDefaultPage(5, 2026, "teacher-appreciation"), createDefaultPage(6, 2026, "pizza-day")]
  return { id: "design-default", name: "February 2026 Lunch Calendar", pages, activePageId: pages[0].id, updatedAt: new Date().toISOString() }
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
