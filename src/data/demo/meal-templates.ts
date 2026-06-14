import type { MealTemplate } from "@/lib/types"

const wrapPhoto =
  "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=600&auto=format&fit=crop"
const friesPhoto =
  "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=600&auto=format&fit=crop"
const cookiePhoto =
  "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=600&auto=format&fit=crop"
const milkPhoto =
  "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=600&auto=format&fit=crop"
const pancakePhoto =
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=600&auto=format&fit=crop"
const turkeyPhoto =
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop"

const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

export const demoMealTemplates: MealTemplate[] = [
  {
    id: "mt-001",
    name: "Chicken Wrap Meal",
    description: "Grilled chicken wrap with seasoned fries, cookie, and milk.",
    category: "lunch",
    mealType: "lunch",
    allergens: ["Wheat", "Milk", "Soy"],
    nutritionNotes: "Approx. 680 cal. Whole grain wrap, lean protein.",
    portionNotes: "1 wrap, 4 oz fries, 1 cookie, 8 oz milk",
    gradeAvailability: ["grades_7_8", "grades_9_12", "teacher", "staff"],
    isFavorite: true,
    isPublished: true,
    isArchived: false,
    lastUsedAt: threeDaysAgo,
    studentMealPrice: 3.25,
    alaCartePrice: 4.5,
    staffMealPrice: 2.0,
    items: [
      { id: "mti-001", name: "Chicken Wrap", sortOrder: 0 },
      { id: "mti-002", name: "Seasoned Fries", sortOrder: 1 },
      { id: "mti-003", name: "Chocolate Chip Cookie", sortOrder: 2 },
      { id: "mti-004", name: "Milk", sortOrder: 3 },
    ],
    photos: [
      { id: "mp-001", slot: "entree", url: wrapPhoto },
      { id: "mp-002", slot: "side", url: friesPhoto },
      { id: "mp-003", slot: "dessert", url: cookiePhoto },
      { id: "mp-004", slot: "drink", url: milkPhoto },
    ],
    createdAt: oneMonthAgo,
    updatedAt: threeDaysAgo,
  },
  {
    id: "mt-002",
    name: "Pancake Breakfast Plate",
    description: "Fluffy pancakes with syrup, fresh fruit, and orange juice.",
    category: "breakfast",
    mealType: "breakfast",
    allergens: ["Gluten", "Eggs", "Dairy"],
    nutritionNotes: "Approx. 420 cal. Served before first period.",
    portionNotes: "2 pancakes, ½ cup fruit, 8 oz juice",
    gradeAvailability: ["grades_7_8", "grades_9_12"],
    isFavorite: false,
    isPublished: true,
    isArchived: false,
    lastUsedAt: twoWeeksAgo,
    studentMealPrice: 2.75,
    alaCartePrice: 3.5,
    staffMealPrice: 2.0,
    items: [
      { id: "mti-005", name: "Pancakes", sortOrder: 0 },
      { id: "mti-006", name: "Fresh Fruit", sortOrder: 1 },
      { id: "mti-007", name: "Orange Juice", sortOrder: 2 },
    ],
    photos: [
      { id: "mp-005", slot: "entree", url: pancakePhoto },
      { id: "mp-006", slot: "drink", url: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0e?q=80&w=600&auto=format&fit=crop" },
    ],
    createdAt: oneMonthAgo,
    updatedAt: twoWeeksAgo,
  },
  {
    id: "mt-003",
    name: "Thanksgiving Feast",
    description: "Roasted turkey, mashed potatoes, green beans, roll, and pumpkin pie.",
    category: "holiday",
    mealType: "special",
    allergens: ["Gluten", "Dairy", "Eggs"],
    nutritionNotes: "Seasonal holiday menu — pre-order recommended.",
    portionNotes: "Full holiday plate with dessert",
    gradeAvailability: ["grades_7_8", "grades_9_12", "teacher", "staff"],
    isFavorite: true,
    isPublished: false,
    isArchived: false,
    lastUsedAt: undefined,
    studentMealPrice: 4.0,
    alaCartePrice: 6.0,
    staffMealPrice: 3.0,
    items: [
      { id: "mti-008", name: "Roasted Turkey", sortOrder: 0 },
      { id: "mti-009", name: "Mashed Potatoes", sortOrder: 1 },
      { id: "mti-010", name: "Green Beans", sortOrder: 2 },
      { id: "mti-011", name: "Dinner Roll", sortOrder: 3 },
      { id: "mti-012", name: "Pumpkin Pie", sortOrder: 4 },
    ],
    photos: [
      { id: "mp-007", slot: "entree", url: turkeyPhoto },
      { id: "mp-008", slot: "dessert", url: "https://images.unsplash.com/photo-1535920527002-b35e00c3aeba?q=80&w=600&auto=format&fit=crop" },
    ],
    createdAt: oneMonthAgo,
    updatedAt: oneMonthAgo,
  },
]

const EXTRA_MEALS: Omit<MealTemplate, "id" | "createdAt" | "updatedAt">[] = [
  { name: "Grilled Cheese & Tomato Soup", category: "lunch", mealType: "lunch", description: "Classic comfort lunch.", allergens: ["Wheat", "Milk"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: false, isPublished: true, isArchived: false, lastUsedAt: twoWeeksAgo, studentMealPrice: 3.0, items: [{ id: "x", name: "Grilled Cheese", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Yogurt Parfait Bar", category: "breakfast", mealType: "breakfast", description: "Build-your-own parfait.", allergens: ["Milk"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: true, isPublished: true, isArchived: false, lastUsedAt: threeDaysAgo, studentMealPrice: 2.5, items: [{ id: "x", name: "Yogurt", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Taco Tuesday Plate", category: "lunch", mealType: "lunch", description: "Seasoned beef tacos with rice.", allergens: ["Wheat", "Milk"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: true, isPublished: true, isArchived: false, lastUsedAt: twoWeeksAgo, studentMealPrice: 3.5, items: [{ id: "x", name: "Tacos", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Spring Salad Bowl", category: "seasonal", mealType: "special", description: "Fresh greens with vinaigrette.", allergens: [], gradeAvailability: ["grades_9_12", "staff"], isFavorite: false, isPublished: true, isArchived: false, studentMealPrice: 3.75, items: [{ id: "x", name: "Salad", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Spirit Week BBQ", category: "special_event", mealType: "special", description: "Pulled pork sandwich and coleslaw.", allergens: ["Wheat"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: false, isPublished: true, isArchived: false, lastUsedAt: oneMonthAgo, studentMealPrice: 4.25, items: [{ id: "x", name: "BBQ Sandwich", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Holiday Cookie Platter", category: "holiday", mealType: "special", description: "Assorted festive cookies.", allergens: ["Wheat", "Milk", "Eggs"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: false, isPublished: false, isArchived: false, studentMealPrice: 2.0, items: [{ id: "x", name: "Cookies", sortOrder: 0 }], photos: [{ id: "x", slot: "dessert", url: cookiePhoto }] },
  { name: "Egg & Cheese Muffin", category: "breakfast", mealType: "breakfast", description: "Hot breakfast sandwich.", allergens: ["Wheat", "Eggs", "Milk"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: false, isPublished: true, isArchived: false, lastUsedAt: twoWeeksAgo, studentMealPrice: 2.75, items: [{ id: "x", name: "Muffin", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1608039829572-7854f21208b0?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Pasta Marinara", category: "lunch", mealType: "lunch", description: "Penne with marinara and garlic bread.", allergens: ["Wheat"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: false, isPublished: true, isArchived: false, studentMealPrice: 3.25, items: [{ id: "x", name: "Pasta", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Fish Fry Friday", category: "lunch", mealType: "lunch", description: "Breaded fish with tartar sauce.", allergens: ["Wheat", "Fish"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: true, isPublished: true, isArchived: false, lastUsedAt: threeDaysAgo, studentMealPrice: 3.75, items: [{ id: "x", name: "Fish", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b779?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Summer Berry Smoothie", category: "seasonal", mealType: "special", description: "Blended berry smoothie.", allergens: ["Milk"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: false, isPublished: true, isArchived: false, studentMealPrice: 2.5, items: [{ id: "x", name: "Smoothie", sortOrder: 0 }], photos: [{ id: "x", slot: "drink", url: "https://images.unsplash.com/photo-1505252587541-0478738a6e10?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Homecoming Tailgate", category: "special_event", mealType: "special", description: "Hot dogs, chips, and lemonade.", allergens: ["Wheat"], gradeAvailability: ["grades_7_8", "grades_9_12", "teacher", "staff"], isFavorite: true, isPublished: true, isArchived: false, lastUsedAt: oneMonthAgo, studentMealPrice: 4.0, items: [{ id: "x", name: "Hot Dog", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1612392062631-94d5c0a81d66?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Oatmeal & Fruit Cup", category: "breakfast", mealType: "breakfast", description: "Warm oatmeal with seasonal fruit.", allergens: [], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: false, isPublished: true, isArchived: false, studentMealPrice: 2.25, items: [{ id: "x", name: "Oatmeal", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1517673400267-025144a127ae?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Chicken Caesar Salad", category: "lunch", mealType: "lunch", description: "Romaine, grilled chicken, parmesan.", allergens: ["Milk", "Eggs"], gradeAvailability: ["grades_9_12", "staff"], isFavorite: false, isPublished: true, isArchived: false, lastUsedAt: twoWeeksAgo, studentMealPrice: 3.5, items: [{ id: "x", name: "Salad", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Valentine's Sweet Treat", category: "holiday", mealType: "special", description: "Cupcake and fruit punch.", allergens: ["Wheat", "Milk", "Eggs"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: false, isPublished: true, isArchived: false, studentMealPrice: 2.5, items: [{ id: "x", name: "Cupcake", sortOrder: 0 }], photos: [{ id: "x", slot: "dessert", url: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Harvest Squash Soup", category: "seasonal", mealType: "special", description: "Butternut squash soup with roll.", allergens: ["Wheat"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: false, isPublished: true, isArchived: false, studentMealPrice: 3.0, items: [{ id: "x", name: "Soup", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Pizza Slice Combo", category: "lunch", mealType: "lunch", description: "Cheese pizza with side salad.", allergens: ["Wheat", "Milk"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: true, isPublished: true, isArchived: false, lastUsedAt: threeDaysAgo, studentMealPrice: 3.25, items: [{ id: "x", name: "Pizza", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Graduation Brunch", category: "special_event", mealType: "special", description: "Celebration brunch spread.", allergens: ["Eggs", "Milk", "Wheat"], gradeAvailability: ["grades_9_12", "teacher", "staff"], isFavorite: false, isPublished: true, isArchived: false, studentMealPrice: 5.0, items: [{ id: "x", name: "Brunch", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: pancakePhoto }] },
  { name: "Turkey & Cranberry Wrap", category: "seasonal", mealType: "lunch", description: "Holiday leftover favorite.", allergens: ["Wheat"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: false, isPublished: true, isArchived: false, lastUsedAt: oneMonthAgo, studentMealPrice: 3.5, items: [{ id: "x", name: "Wrap", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: wrapPhoto }] },
  { name: "Classic BLT Sandwich", category: "lunch", mealType: "lunch", description: "Bacon, lettuce, tomato on wheat.", allergens: ["Wheat"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: false, isPublished: true, isArchived: false, studentMealPrice: 3.25, items: [{ id: "x", name: "BLT", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=600&auto=format&fit=crop" }] },
  { name: "Archived Test Kitchen", category: "lunch", mealType: "lunch", description: "Retired pilot menu.", allergens: [], gradeAvailability: ["grades_7_8"], isFavorite: false, isPublished: false, isArchived: true, studentMealPrice: 3.0, items: [{ id: "x", name: "Test", sortOrder: 0 }], photos: [] },
  { name: "Waffle Wednesday", category: "breakfast", mealType: "breakfast", description: "Belgian waffles with syrup.", allergens: ["Wheat", "Eggs", "Milk"], gradeAvailability: ["grades_7_8", "grades_9_12"], isFavorite: true, isPublished: true, isArchived: false, lastUsedAt: twoWeeksAgo, studentMealPrice: 2.75, items: [{ id: "x", name: "Waffles", sortOrder: 0 }], photos: [{ id: "x", slot: "entree", url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=600&auto=format&fit=crop" }] },
]

const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

for (let i = 0; i < EXTRA_MEALS.length; i++) {
  const base = EXTRA_MEALS[i]
  const id = `mt-${String(i + 4).padStart(3, "0")}`
  demoMealTemplates.push({
    ...base,
    id,
    items: base.items.map((item, j) => ({ ...item, id: `mti-${id}-${j}` })),
    photos: base.photos.map((photo, j) => ({ ...photo, id: `mp-${id}-${j}` })),
    createdAt: i < 3 ? fiveDaysAgo : oneMonthAgo,
    updatedAt: base.lastUsedAt ?? oneMonthAgo,
  })
}
