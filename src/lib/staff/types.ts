export interface StaffProfile {
  id: string
  displayName: string
  email: string
  department: string
  accountBalance: number
  photoUrl?: string
}

export interface StaffAnnouncement {
  id: string
  title: string
  body: string
  date: string
}

export interface StaffMessage {
  id: string
  source: "announcement" | "notification"
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface StaffTransaction {
  id: string
  studentId: string
  studentName: string
  meal: string
  amount: number
  balanceAfter: number
  timestamp: string
  type: "meal" | "deposit"
}
