import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany();
    return NextResponse.json(employees);
  } catch (error) {
    console.error("خطأ في جلب الموظفين:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب الموظفين" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // التحقق من وجود جميع الحقول المطلوبة
    if (
      !body.name ||
      !body.jobTitle ||
      !body.nationalId ||
      !body.phoneNumber ||
      body.dailySalary === undefined
    ) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    // التحقق من أن dailySalary هو رقم صالح
    const dailySalary = parseFloat(body.dailySalary);
    if (isNaN(dailySalary)) {
      return NextResponse.json(
        { error: "الراتب اليومي يجب أن يكون رقمًا صالحًا" },
        { status: 400 }
      );
    }

    // إنشاء الموظف في قاعدة البيانات
    const employee = await prisma.employee.create({
      data: {
        name: body.name,
        jobTitle: body.jobTitle,
        nationalId: body.nationalId,
        phoneNumber: body.phoneNumber,
        dailySalary: dailySalary, // تمرير القيمة كنوع عددي لـ Decimal
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error("خطأ في إنشاء الموظف:", error);

    // التعامل مع أخطاء قيد الـ @unique
    if (error.code === "P2002") {
      const field = error.meta?.target[0];
      return NextResponse.json(
        {
          error:
            field === "nationalId"
              ? "الرقم القومي موجود مسبقًا"
              : "رقم الهاتف موجود مسبقًا",
        },
        { status: 400 }
      );
    }

    // خطأ عام
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء الموظف", details: error.message },
      { status: 500 }
    );
  }
}
