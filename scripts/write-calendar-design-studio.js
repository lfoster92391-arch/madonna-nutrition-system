const fs = require("fs")
const path = require("path")

const root = path.join(__dirname, "..")

function write(rel, content) {
  const full = path.join(root, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content.replace(/\r?\n/g, "\n"), "utf8")
  console.log("wrote", rel)
}

write(
  "src/data/daily-bite-facts.ts",
  `export interface DailyBiteFact {
  id: string
  text: string
  themes: string[]
  emoji: string
}

export const DAILY_BITE_FACTS: DailyBiteFact[] = [
  { id: "chocolate", text: "Dark chocolate contains antioxidants that may support heart health when enjoyed in moderation.", themes: ["valentines-day", "christmas-lunch"], emoji: "🍫" },
  { id: "carrots", text: "Carrots are rich in beta-carotene, which helps support healthy vision.", themes: ["spring-celebration", "st-patricks-day"], emoji: "🥕" },
  { id: "whole-grains", text: "Whole grains provide fiber that helps keep you full and energized throughout the school day.", themes: ["teacher-appreciation", "spring-celebration"], emoji: "🌾" },
  { id: "tomatoes", text: "Tomatoes are technically a fruit and are packed with vitamin C and lycopene.", themes: ["pizza-day", "taco-tuesday"], emoji: "🍅" },
  { id: "dairy", text: "Low-fat dairy products provide calcium and vitamin D for strong bones.", themes: ["national-donut-day", "christmas-lunch"], emoji: "🥛" },
  { id: "water", text: "Drinking water throughout the day helps you stay focused and feel your best.", themes: ["valentines-day", "spring-celebration", "teacher-appreciation"], emoji: "💧" },
]

export const DAILY_BITE_CATEGORIES = [
  { id: "food-facts", label: "Daily Bite / Food Facts", emoji: "🧁" },
  { id: "nutrition-tips", label: "Nutrition Tips", emoji: "🥗" },
  { id: "fun-facts", label: "Fun Food Facts", emoji: "🎉" },
  { id: "seasonal", label: "Seasonal Highlights", emoji: "🌸" },
] as const

export function getFactsForTheme(themeId: string): DailyBiteFact[] {
  const matched = DAILY_BITE_FACTS.filter((f) => f.themes.includes(themeId))
  return matched.length > 0 ? matched : DAILY_BITE_FACTS
}
`
)

write(
  "src/lib/calendar-design/types.ts",
  `export type ViewportMode = "desktop" | "tablet" | "mobile" | "print"

export type DesignElementType =
  | "calendar_grid" | "event_box" | "meal_card" | "header" | "announcement"
  | "featured_meal" | "image" | "text_box" | "icon" | "divider" | "sticker"
  | "qr_code" | "did_you_know" | "staff_pick" | "countdown" | "seasonal_banner" | "nutrition_box"

export interface ElementAppearance {
  backgroundColor: string
  borderColor: string
  borderRadius: number
  padding: number
  showTitle: boolean
  titleStyle: string
  textColor: string
  shadow: number
  animation: number
  spacing: number
}

export interface DailyBiteSettings {
  category: string
  autoMatchTheme: boolean
  rotateDaily: boolean
  factIndex: number
}

export interface StaffPickSettings {
  title: string
  subtitle: string
  mealName: string
  staffName: string
}

export interface DesignElement {
  id: string
  type: DesignElementType
  label: string
  x: number
  y: number
  width: number
  height: number
  appearance: ElementAppearance
  content?: string
  staffPick?: StaffPickSettings
  dailyBite?: DailyBiteSettings
}

export interface DesignPage {
  id: string
  title: string
  month: number
  year: number
  themeId: string
  elements: DesignElement[]
}

export interface CalendarDesignDocument {
  id: string
  name: string
  pages: DesignPage[]
  activePageId: string
  updatedAt: string
}

export const ELEMENT_CATALOG: { type: DesignElementType; label: string; icon: string }[] = [
  { type: "calendar_grid", label: "Calendar Grid", icon: "📅" },
  { type: "event_box", label: "Event Box", icon: "📋" },
  { type: "meal_card", label: "Meal Card", icon: "🍽️" },
  { type: "header", label: "Header", icon: "🏷️" },
  { type: "announcement", label: "Announcement", icon: "📢" },
  { type: "featured_meal", label: "Featured Meal", icon: "⭐" },
  { type: "image", label: "Image", icon: "🖼️" },
  { type: "text_box", label: "Text Box", icon: "📝" },
  { type: "icon", label: "Icon", icon: "✨" },
  { type: "divider", label: "Divider", icon: "➖" },
  { type: "sticker", label: "Sticker", icon: "🎨" },
  { type: "qr_code", label: "QR Code", icon: "📱" },
  { type: "did_you_know", label: "Did You Know Box", icon: "💡" },
  { type: "staff_pick", label: "Staff Pick Card", icon: "👩‍🏫" },
  { type: "countdown", label: "Countdown", icon: "⏳" },
  { type: "seasonal_banner", label: "Seasonal Banner", icon: "🎉" },
  { type: "nutrition_box", label: "Nutrition Box", icon: "🥗" },
]

export const VIEWPORT_WIDTHS: Record<ViewportMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
  print: "816px",
}
`
)

write(
  "src/lib/calendar-design/defaults.ts",
  `import type { DesignElement, DesignPage, ElementAppearance } from "@/lib/calendar-design/types"

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
    id: \`page-\${year}-\${month}\`,
    title: \`\${monthNames[month - 1]} \${year} Lunch Calendar\`,
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
`
)

write(
  "src/lib/calendar-design/storage.ts",
  `import { createDefaultDocument } from "@/lib/calendar-design/defaults"
import type { CalendarDesignDocument } from "@/lib/calendar-design/types"

const STORAGE_KEY = "madonna-calendar-design-v1"

export function loadDesignDocument(): CalendarDesignDocument {
  if (typeof window === "undefined") return createDefaultDocument()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultDocument()
    const parsed = JSON.parse(raw) as CalendarDesignDocument
    if (!parsed.pages?.length) return createDefaultDocument()
    return parsed
  } catch {
    return createDefaultDocument()
  }
}

export function saveDesignDocument(doc: CalendarDesignDocument): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...doc, updatedAt: new Date().toISOString() }))
}

export function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}
`
)

write(
  "src/app/(platform)/admin/calendar/design/page.tsx",
  `import { CalendarDesignStudio } from "@/components/admin/calendar-design/CalendarDesignStudio"

export const metadata = {
  title: "Calendar Design Studio | Madonna Nutrition",
  description: "Create beautiful, engaging lunch calendars for your school community.",
}

export default function CalendarDesignPage() {
  return <CalendarDesignStudio />
}
`
)

console.log("Calendar design data/lib/page files written. Run component writer next.")
