export type ViewportMode = "desktop" | "tablet" | "mobile" | "print"

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
  /** Linked cookbook meal for meal_card / featured_meal elements */
  mealRef?: {
    templateId: string
    name: string
    photoUrl?: string
    category?: string
  }
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

/** Full catalog kept for type coverage; UI uses BASIC_ELEMENT_CATALOG. */
export const ELEMENT_CATALOG: { type: DesignElementType; label: string; icon: string; hint?: string }[] = [
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

/** Approachable subset shown in the Elements panel. */
export const BASIC_ELEMENT_CATALOG: {
  type: DesignElementType
  label: string
  icon: string
  hint: string
}[] = [
  { type: "announcement", label: "Announcement", icon: "📢", hint: "School note or reminder" },
  { type: "meal_card", label: "Meal highlight", icon: "🍽️", hint: "Feature a lunch item" },
  { type: "did_you_know", label: "Did You Know", icon: "💡", hint: "Fun nutrition fact" },
  { type: "staff_pick", label: "Staff Pick", icon: "👩‍🏫", hint: "Favorite meal shout-out" },
  { type: "nutrition_box", label: "Nutrition tip", icon: "🥗", hint: "Healthy eating tip" },
  { type: "text_box", label: "Text note", icon: "📝", hint: "Custom message" },
]

/** Built-in page blocks that live in the main canvas layout (not free-floating overlays). */
export const CORE_ELEMENT_TYPES: DesignElementType[] = [
  "calendar_grid",
  "did_you_know",
  "staff_pick",
]

export const VIEWPORT_WIDTHS: Record<ViewportMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
  print: "816px",
}
