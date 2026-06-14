import type { Student } from "@/lib/types"
import type {
  TeacherAnnouncement,
  TeacherDashboardStats,
  TeacherLunchReservation,
  StudentLunchSignupView,
} from "@/lib/teacher/types"
import { STUDENT_MEAL_PRICE } from "@/lib/teacher/low-funds"

export const TEACHER_NAVY = "#041B52"
export const TEACHER_SILVER = "#AEB6C2"

export const demoTeacherProfile = {
  department: "Math Department",
  accountBalance: 42.75,
  photoUrl:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
}

/** Students visible in teacher portal (includes mockup names). */
export const teacherPortalStudents: Student[] = [
  {
    id: "10501",
    firstName: "Emma",
    lastName: "Johnson",
    grade: "10",
    homeroom: "102",
    balance: 3.5,
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
    allergies: [],
    dietaryRestrictions: [],
    parentContacts: [],
  },
  {
    id: "10502",
    firstName: "Mason",
    lastName: "Brown",
    grade: "9",
    homeroom: "201",
    balance: 18.0,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
    allergies: [],
    dietaryRestrictions: [],
    parentContacts: [],
  },
  {
    id: "10503",
    firstName: "Sophia",
    lastName: "Davis",
    grade: "11",
    homeroom: "305",
    balance: 22.5,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
    allergies: [],
    dietaryRestrictions: [],
    parentContacts: [],
  },
  {
    id: "10504",
    firstName: "Noah",
    lastName: "Thompson",
    grade: "8",
    homeroom: "108",
    balance: 1.25,
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
    allergies: [],
    dietaryRestrictions: [],
    parentContacts: [],
  },
  {
    id: "10505",
    firstName: "Isabella",
    lastName: "Reed",
    grade: "10",
    homeroom: "110",
    balance: 2.0,
    photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=400&auto=format&fit=crop",
    allergies: [],
    dietaryRestrictions: [],
    parentContacts: [],
  },
  {
    id: "10506",
    firstName: "Liam",
    lastName: "Carter",
    grade: "12",
    homeroom: "401",
    balance: 35.0,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    allergies: [],
    dietaryRestrictions: [],
    parentContacts: [],
  },
]

export const demoTeacherLunchReservation: TeacherLunchReservation = {
  id: "tlr-demo-001",
  mealName: "Grilled Chicken Plate",
  mealPrice: 5.25,
  mealPhotoUrl:
    "https://images.unsplash.com/photo-1604908176997-431cef8a0b38?q=80&w=400&auto=format&fit=crop",
  paymentMethod: "account",
  status: "reserved",
  pickupLocation: "Main Cafeteria",
  pickupStart: "11:15 AM",
  pickupEnd: "1:15 PM",
  cutoffTime: "10:00 AM",
}

function signupStatus(
  paymentMethod: StudentLunchSignupView["paymentMethod"],
  balance: number
): StudentLunchSignupView["status"] {
  if (paymentMethod === "pay_at_kiosk") return "pay_at_kiosk"
  if (paymentMethod === "prepay_online") return "prepaid"
  if (balance < STUDENT_MEAL_PRICE) return "low_funds"
  return "using_account"
}

export const demoStudentLunchSignups: StudentLunchSignupView[] = [
  {
    id: "sls-001",
    studentId: "10501",
    studentName: "Emma Johnson",
    photo: teacherPortalStudents[0].photo,
    grade: "10",
    paymentMethod: "account",
    status: signupStatus("account", 3.5),
    signedUpAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sls-002",
    studentId: "10502",
    studentName: "Mason Brown",
    photo: teacherPortalStudents[1].photo,
    grade: "9",
    paymentMethod: "prepay_online",
    status: "prepaid",
    signedUpAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sls-003",
    studentId: "10503",
    studentName: "Sophia Davis",
    photo: teacherPortalStudents[2].photo,
    grade: "11",
    paymentMethod: "account",
    status: "using_account",
    signedUpAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sls-004",
    studentId: "10504",
    studentName: "Noah Thompson",
    photo: teacherPortalStudents[3].photo,
    grade: "8",
    paymentMethod: "account",
    status: signupStatus("account", 1.25),
    signedUpAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: "sls-005",
    studentId: "10505",
    studentName: "Isabella Reed",
    photo: teacherPortalStudents[4].photo,
    grade: "10",
    paymentMethod: "pay_at_kiosk",
    status: "pay_at_kiosk",
    signedUpAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
]

export const demoTeacherDashboardStats: TeacherDashboardStats = {
  studentsSignedUp: 24,
  payAtKiosk: 8,
  usingAccount: 10,
  usingAccountLowFunds: 3,
  prepaidOnline: 6,
}

export const demoTeacherAnnouncements: TeacherAnnouncement[] = [
  {
    id: "ann-001",
    title: "Special Lunch Next Week!",
    body: "Taco Tuesday on May 14th — remind students to sign up before the 10:00 AM cutoff.",
    date: "2025-05-09",
  },
  {
    id: "ann-002",
    title: "Badge Reminder",
    body: "All staff and students must bring lunch badges to the cafeteria this week.",
    date: "2025-05-08",
  },
]

export const demoTeacherRecentStudentIds = ["10501", "10502", "10503", "10504"]
