/** Default teacher lunch reservation field values when not stored in DB. */
export const TEACHER_LUNCH_DEFAULTS = {
  mealName: "Staff Lunch",
  mealPrice: 5.25,
  mealPhotoUrl:
    "https://images.unsplash.com/photo-1604908176997-431cef8a0b38?q=80&w=400&auto=format&fit=crop",
  pickupLocation: "Main Cafeteria",
  pickupStart: "11:15 AM",
  pickupEnd: "1:15 PM",
  cutoffTime: "10:00 AM",
} as const
