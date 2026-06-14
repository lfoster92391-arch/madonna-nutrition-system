export interface DailyBiteFact {
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
