import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { withTeacherAccess } from "@/lib/teacher/api"
import { fromDbPaymentMethod, todayDateOnly } from "@/lib/teacher/db"
import { isLowFunds, STUDENT_MEAL_PRICE } from "@/lib/teacher/low-funds"
import { demoTeacherDashboardStats } from "@/data/demo/teacher"

export async function GET(request: Request) {
  const teacherId = new URL(request.url).searchParams.get("teacherId")

  return withTeacherAccess(teacherId, async () => {
    const schoolId = await resolveSchoolId()
    const today = todayDateOnly()

    const signups = await prisma.studentLunchSignup.findMany({
      where: { schoolId, date: today },
      include: { student: true },
    })

    if (signups.length === 0) {
      return NextResponse.json({ stats: demoTeacherDashboardStats })
    }

    let payAtKiosk = 0
    let usingAccount = 0
    let usingAccountLowFunds = 0
    let prepaidOnline = 0

    for (const signup of signups) {
      const method = fromDbPaymentMethod(signup.paymentMethod)
      if (method === "pay_at_kiosk") payAtKiosk++
      else if (method === "prepay_online") prepaidOnline++
      else {
        usingAccount++
        if (isLowFunds(Number(signup.student.balance), STUDENT_MEAL_PRICE)) {
          usingAccountLowFunds++
        }
      }
    }

    return NextResponse.json({
      stats: {
        studentsSignedUp: signups.length,
        payAtKiosk,
        usingAccount,
        usingAccountLowFunds,
        prepaidOnline,
      },
    })
  })
}
