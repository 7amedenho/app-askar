import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { differenceInMinutes } from "date-fns"; // استبدال differenceInHours بـ differenceInMinutes

export async function GET(req: NextRequest) {
  try {
    // استخراج startDate و endDate من query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // إعداد شروط التصفية بناءً على التاريخ
    const dateFilter: {
      date?: {
        gte?: Date;
        lte?: Date;
      }
    } = {};
    if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate), // أكبر من أو يساوي تاريخ البداية
        lte: new Date(endDate), // أقل من أو يساوي تاريخ النهاية
      };
    } else if (startDate) {
      dateFilter.date = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      dateFilter.date = {
        lte: new Date(endDate),
      };
    }

    // جلب سجلات الحضور مع تطبيق الفلتر
    const attendance = await prisma.attendance.findMany({
      where: dateFilter, // تطبيق فلتر التاريخ إذا وُجد
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            jobTitle: true,
            nationalId: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("خطأ في جلب سجلات الحضور:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب سجلات الحضور" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.employeeId || !body.date || !body.checkIn) {
      return NextResponse.json(
        { error: "جميع الحقول المطلوبة غير متوفرة" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: body.employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "لم يتم العثور على الموظف" },
        { status: 404 }
      );
    }

    let overtimeHours = 0;
    if (body.checkOut) {
      const checkIn = new Date(body.checkIn);
      const checkOut = new Date(body.checkOut);
      const minutesWorked = differenceInMinutes(checkOut, checkIn);
      const hoursWorked = minutesWorked / 60; // تحويل الدقائق لساعات كعدد كسري
      overtimeHours = hoursWorked > 8 ? hoursWorked - 8 : 0;
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: body.employeeId,
        date: new Date(body.date),
        checkIn: new Date(body.checkIn),
        checkOut: body.checkOut ? new Date(body.checkOut) : null,
        overtimeHours: overtimeHours || null,
        notes: body.notes,
      },
    });

    if (body.checkOut) {
      const success = await updateEmployeeBudget(
        body.employeeId,
        body.checkIn,
        body.checkOut,
        employee.dailySalary
      );
      if (!success) {
        throw new Error("فشل في تحديث ميزانية الموظف");
      }
    }

    return NextResponse.json(attendance, { status: 201 });
  } catch (error: unknown) {
    console.error("خطأ في إنشاء سجل الحضور:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء سجل الحضور", details: errorMessage },
      { status: 500 }
    );
  }
}

async function updateEmployeeBudget(
  employeeId: number,
  checkInTime: string | Date,
  checkOutTime: string | Date | null,
  dailySalary: number,
  action: "add" | "subtract" = "add"
) {
  try {
    if (!checkOutTime) return false;

    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const minutesWorked = differenceInMinutes(checkOut, checkIn);
    const hoursWorked = minutesWorked / 60; // الساعات كعدد كسري

    let amountToAdd = 0;
    const hourlyRate = dailySalary / 8;

    if (hoursWorked >= 8) {
      amountToAdd = dailySalary;
      const overtimeHours = hoursWorked - 8;
      if (overtimeHours > 0) {
        const overtimeRate = hourlyRate * 1.5;
        amountToAdd += overtimeHours * overtimeRate;
      }
    } else if (hoursWorked >= 6.5) {
      amountToAdd = dailySalary;
    } else {
      amountToAdd = hoursWorked * hourlyRate;
    }

    const finalAmount =
      action === "add" ? Math.round(amountToAdd) : -Math.round(amountToAdd);

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        budget: {
          increment: finalAmount,
        },
      },
    });

    console.log(
      `تم تحديث ميزانية الموظف ${employeeId}: +${finalAmount} (ساعات العمل: ${hoursWorked}, الساعات الإضافية: ${
        hoursWorked - 8 > 0 ? hoursWorked - 8 : 0
      })`
    );
    return true;
  } catch (error) {
    console.error("خطأ في تحديث ميزانية الموظف:", error);
    return false;
  }
}
