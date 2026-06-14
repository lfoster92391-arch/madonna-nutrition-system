export interface CalendarTheme {
  id: string
  name: string
  emoji: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    headerBg: string
    headerText: string
    border: string
    text: string
    labelLunch: string
    labelSpecial: string
    labelTeacher: string
    labelNoSchool: string
  }
  decorations: string[]
}

export const CALENDAR_THEMES: CalendarTheme[] = [
  {
    id: "valentines-day",
    name: "Valentine's Day",
    emoji: "💕",
    colors: {
      primary: "#F28CB8",
      secondary: "#FFF2F6",
      accent: "#E91E8C",
      background: "#FFF9FB",
      headerBg: "linear-gradient(135deg, #F28CB8 0%, #E91E8C 100%)",
      headerText: "#FFFFFF",
      border: "#F28CB8",
      text: "#6B2C59",
      labelLunch: "#22C55E",
      labelSpecial: "#3B82F6",
      labelTeacher: "#F97316",
      labelNoSchool: "#EF4444",
    },
    decorations: ["💕", "💖", "💗", "🎀"],
  },
  {
    id: "pizza-day",
    name: "Pizza Day",
    emoji: "🍕",
    colors: {
      primary: "#F97316",
      secondary: "#FFF7ED",
      accent: "#EA580C",
      background: "#FFFBF5",
      headerBg: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)",
      headerText: "#FFFFFF",
      border: "#FB923C",
      text: "#7C2D12",
      labelLunch: "#22C55E",
      labelSpecial: "#3B82F6",
      labelTeacher: "#8B5CF6",
      labelNoSchool: "#EF4444",
    },
    decorations: ["🍕", "🧀", "🍅"],
  },
  {
    id: "taco-tuesday",
    name: "Taco Tuesday",
    emoji: "🌮",
    colors: {
      primary: "#84CC16",
      secondary: "#F7FEE7",
      accent: "#65A30D",
      background: "#FAFFF0",
      headerBg: "linear-gradient(135deg, #A3E635 0%, #65A30D 100%)",
      headerText: "#FFFFFF",
      border: "#84CC16",
      text: "#365314",
      labelLunch: "#22C55E",
      labelSpecial: "#3B82F6",
      labelTeacher: "#F97316",
      labelNoSchool: "#EF4444",
    },
    decorations: ["🌮", "🥑", "🌶️"],
  },
  {
    id: "st-patricks-day",
    name: "St. Patrick's Day",
    emoji: "☘️",
    colors: {
      primary: "#22C55E",
      secondary: "#F0FDF4",
      accent: "#15803D",
      background: "#F7FFF9",
      headerBg: "linear-gradient(135deg, #4ADE80 0%, #15803D 100%)",
      headerText: "#FFFFFF",
      border: "#22C55E",
      text: "#14532D",
      labelLunch: "#22C55E",
      labelSpecial: "#3B82F6",
      labelTeacher: "#F97316",
      labelNoSchool: "#EF4444",
    },
    decorations: ["☘️", "🍀", "🌈"],
  },
  {
    id: "teacher-appreciation",
    name: "Teacher Appreciation",
    emoji: "🍎",
    colors: {
      primary: "#EF4444",
      secondary: "#FEF2F2",
      accent: "#B91C1C",
      background: "#FFFAFA",
      headerBg: "linear-gradient(135deg, #F87171 0%, #B91C1C 100%)",
      headerText: "#FFFFFF",
      border: "#EF4444",
      text: "#7F1D1D",
      labelLunch: "#22C55E",
      labelSpecial: "#3B82F6",
      labelTeacher: "#F97316",
      labelNoSchool: "#64748B",
    },
    decorations: ["🍎", "📚", "✏️"],
  },
  {
    id: "spring-celebration",
    name: "Spring Celebration",
    emoji: "🌸",
    colors: {
      primary: "#EC4899",
      secondary: "#FDF2F8",
      accent: "#BE185D",
      background: "#FFFBFE",
      headerBg: "linear-gradient(135deg, #F472B6 0%, #BE185D 100%)",
      headerText: "#FFFFFF",
      border: "#EC4899",
      text: "#831843",
      labelLunch: "#22C55E",
      labelSpecial: "#3B82F6",
      labelTeacher: "#F97316",
      labelNoSchool: "#EF4444",
    },
    decorations: ["🌸", "🦋", "🌷"],
  },
  {
    id: "christmas-lunch",
    name: "Christmas Lunch",
    emoji: "🎄",
    colors: {
      primary: "#DC2626",
      secondary: "#FEF2F2",
      accent: "#15803D",
      background: "#FAFFFA",
      headerBg: "linear-gradient(135deg, #DC2626 0%, #15803D 100%)",
      headerText: "#FFFFFF",
      border: "#DC2626",
      text: "#14532D",
      labelLunch: "#22C55E",
      labelSpecial: "#3B82F6",
      labelTeacher: "#F97316",
      labelNoSchool: "#64748B",
    },
    decorations: ["🎄", "⭐", "🎁"],
  },
  {
    id: "national-donut-day",
    name: "National Donut Day",
    emoji: "🍩",
    colors: {
      primary: "#D946EF",
      secondary: "#FAF5FF",
      accent: "#A21CAF",
      background: "#FDFAFF",
      headerBg: "linear-gradient(135deg, #E879F9 0%, #A21CAF 100%)",
      headerText: "#FFFFFF",
      border: "#D946EF",
      text: "#701A75",
      labelLunch: "#22C55E",
      labelSpecial: "#3B82F6",
      labelTeacher: "#F97316",
      labelNoSchool: "#EF4444",
    },
    decorations: ["🍩", "🧁", "🎂"],
  },
]

export function getThemeById(id: string): CalendarTheme {
  return CALENDAR_THEMES.find((t) => t.id === id) ?? CALENDAR_THEMES[0]
}
