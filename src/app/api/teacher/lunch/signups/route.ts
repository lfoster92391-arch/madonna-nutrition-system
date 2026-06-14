import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { withTeacherAccess } from "@/lib/teacher/api"
import { fromDbPaymentMethod, todayDateOnly } from "@/lib/teacher/db"
import { isLowFunds, STUDENT_MEAL_PRICE } from "@/lib/teacher/low-funds"

function signupStatus(
  paymentMethod: ReturnType<typeof fromDbPaymentMethod>,
  balance: number
) {
  if (paymentMethod === "pay_at_kiosk") return "pay_at_kiosk"
  if (paymentMethod === "prepay_online") return "prepaid"
  if (isLowFunds(balance, STUDENT_MEAL_PRICE)) return "low_funds"
  return "using_account"
}

export async function GET(request: Request) {
  const teacherId = new URL(request.url).searchParams.get("teacherId")

  return withTeacherAccess(teacherId, async () => {
    const schoolId = await resolveSchoolId()
    const today = todayDateOnly()

    const signups = await prisma.studentLunchSignup.findMany({
      where: { schoolId, date: today },
      include: { student: true },
      orderBy: { signedUpAt: "desc" },
    })

    const rows = signups.map((signup) => {
      const paymentMethod = fromDbPaymentMethod(signup.paymentMethod)
      const balance = Number(signup.student.balance)
      return {
        id: signup.id,
        studentId: signup.student.externalId,
        studentName: `${signup.student.firstName} ${signup.student.lastName}`,
        photo: signup.student.photo ?? "",
        grade: signup.student.grade,
        paymentMethod,
        status: signupStatus(paymentMethod, balance),
        signedUpAt: signup.signedUpAt.toISOString(),
      }
    })

    return NextResponse.json({ signups: rows })
  })
}
