export type TeacherPaymentMethod = "account" | "prepay_online" | "pay_at_kiosk"

export type TeacherLunchStatus = "reserved" | "cancelled" | "pending"

export interface TeacherProfile {
  id: string
  displayName: string
  email: string
  department: string
  accountBalance: number
  photoUrl?: string
}

export interface TeacherLunchReservation {
  id: string
  mealName: string
  mealPrice: number
  sliceCount?: number | null
  unitPrice?: number | null
  totalAmount?: number | null
  mealPhotoUrl: string
  paymentMethod: TeacherPaymentMethod
  status: TeacherLunchStatus
  pickupLocation: string
  pickupStart: string
  pickupEnd: string
  cutoffTime: string
}

/** Student data safe for teacher view — never includes balance or financial history. */
export interface TeacherStudentView {
  id: string
  firstName: string
  lastName: string
  photo: string
  grade: string
  homeroom?: string
  counselor?: string
  lowFunds: boolean
}

export interface StudentLunchSignupView {
  id: string
  studentId: string
  studentName: string
  photo: string
  grade: string
  paymentMethod: TeacherPaymentMethod
  status: "using_account" | "prepaid" | "pay_at_kiosk" | "low_funds"
  signedUpAt: string
}

export interface StudentLunchActivityItem {
  id: string
  mealType: string
  mealTypeLabel: string
  status: string
  statusLabel: string
  price: number
  sliceCount: number | null
  createdAt: string
  updatedAt?: string
}

export interface StudentLunchActivityUpcoming extends StudentLunchActivityItem {
  date: string
}

export interface StudentLunchLiveActivity {
  date: string
  signedUp: boolean
  activity: {
    mealName: string | null
    signedUpAt: string | null
    paymentMethod: TeacherPaymentMethod | null
    status: string
    statusLabel: string
    signedUpBy: {
      id: string
      name: string
      role: string
      roleKey: string | null
    } | null
    items: StudentLunchActivityItem[]
  } | null
  upcoming: StudentLunchActivityUpcoming[]
}

export interface TeacherDashboardStats {
  studentsSignedUp: number
  payAtKiosk: number
  usingAccount: number
  usingAccountLowFunds: number
  prepaidOnline: number
}

export interface TeacherAnnouncement {
  id: string
  title: string
  body: string
  date: string
}
