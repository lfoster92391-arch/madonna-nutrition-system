export interface DailyBiteFact {
  id: string
  text: string
  themes: string[]
  emoji: string
}

export const DAILY_BITE_FACTS: DailyBiteFact[] = [
  { id: "chocolate", text: "Dark chocolate contains antioxidants that may support heart health when enjoyed in moderation.", themes: ["valentines-day", "christmas-lunch"], emoji: "🍫" },
  { id: "carrots", text: "Carrots are rich in beta-carotene, which helps support healthy vision.", themes: ["spring-celebration", "st-patricks-day", "easter"], emoji: "🥕" },
  { id: "whole-grains", text: "Whole grains provide fiber that helps keep you full and energized throughout the school day.", themes: ["teacher-appreciation", "spring-celebration", "back-to-school"], emoji: "🌾" },
  { id: "tomatoes", text: "Tomatoes are technically a fruit and are packed with vitamin C and lycopene.", themes: ["pizza-day", "taco-tuesday"], emoji: "🍅" },
  { id: "dairy", text: "Low-fat dairy products provide calcium and vitamin D for strong bones.", themes: ["national-donut-day", "christmas-lunch", "winter-warmth"], emoji: "🥛" },
  { id: "water", text: "Drinking water throughout the day helps you stay focused and feel your best.", themes: ["valentines-day", "spring-celebration", "teacher-appreciation", "graduation"], emoji: "💧" },
  { id: "apples", text: "An apple a day provides fiber and vitamin C — a classic fuel for learning.", themes: ["back-to-school", "teacher-appreciation"], emoji: "🍎" },
  { id: "cranberries", text: "Cranberries are naturally tart and rich in compounds that support urinary tract health.", themes: ["thanksgiving", "christmas-lunch"], emoji: "🫐" },
  { id: "pumpkin", text: "Pumpkin is packed with vitamin A, which helps keep your immune system strong.", themes: ["halloween", "thanksgiving"], emoji: "🎃" },
  { id: "berries", text: "Colorful berries are loaded with antioxidants that help your body stay resilient.", themes: ["patriotic", "easter", "spring-celebration"], emoji: "🫐" },
  { id: "soup", text: "Warm soups made with veggies and lean protein are a cozy way to stay nourished in cold weather.", themes: ["winter-warmth", "new-years", "christmas-lunch"], emoji: "🍲" },
  { id: "eggs", text: "Eggs are an excellent source of high-quality protein and choline for brain health.", themes: ["easter", "back-to-school"], emoji: "🥚" },
  { id: "celebration-balance", text: "Special celebration meals can still include colorful fruits and veggies for balanced energy.", themes: ["graduation", "new-years", "patriotic"], emoji: "🥗" },
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
