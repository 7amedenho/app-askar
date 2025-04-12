import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { differenceInHours } from "date-fns";

const prisma = new PrismaClient();

// دالة مساعدة لتحديث الميزانية
async function updateEmployeeBudget(
  employeeId: number,
  checkInTime: string | Date,
  checkOutTime: string | Date | null,
  dailySalary: number,
  action: "add" | "subtract" = "add"
) {
  try {
    if (!checkOutTime) return; // لو مفيش وقت انصراف، متعملش حاجة

    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const hoursWorked = differenceInHours(checkOut, checkIn);

    let amountToAdd = 0;
    const hourlyRate = dailySalary / 8; // سعر الساعة العادية

    if (hoursWorked >= 8) {
      // لو 8 ساعات أو أكتر، ياخد الراتب كامل + ساعات إضافية
      amountToAdd = dailySalary;
      const overtimeHours = hoursWorked - 8;
      if (overtimeHours > 0) {
        const overtimeRate = hourlyRate * 1.5; // الساعة الإضافية بـ 1.5
        amountToAdd += overtimeHours * overtimeRate;
      }
    } else if (hoursWorked >= 6.5) {
      // لو بين 6.5 و 8 ساعات، ياخد الراتب اليومي كامل
      amountToAdd = dailySalary;
    } else {
      // لو أقل من 6.5 ساعة، يتحسب على الساعات الفعلية
      amountToAdd = hoursWorked * hourlyRate;
    }

    const finalAmount = action === "add" ? Math.round(amountToAdd) : -Math.round(amountToAdd);

    // تحديث الميزانية
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        budget: {
          increment: finalAmount,
        },
      },
    });

    return true;
  } catch (error) {
    console.error("خطأ في تحديث ميزانية الموظف:", error);
    return false;
  }
}
// دالة PUT لتعديل سجل الحضور
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: "معرف السجل مطلوب" }, { status: 400 });
    }

    const { employeeId, date, checkIn, checkOut, notes } = body;
    if (!employeeId || !date || !checkIn) {
      return NextResponse.json(
        { error: "البيانات المطلوبة (employeeId, date, checkIn) غير موجودة" },
        { status: 400 }
      );
    }

    // جلب السجل القديم للمقارنة
    const oldAttendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id) },
      include: { employee: { select: { dailySalary: true } } },
    });

    if (!oldAttendance) {
      return NextResponse.json(
        { error: "سجل الحضور غير موجود" },
        { status: 404 }
      );
    }

    // تحديث السجل
    const updatedAttendance = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: {
        employeeId: parseInt(employeeId),
        date: new Date(date),
        checkIn: new Date(checkIn),
        checkOut: checkOut ? new Date(checkOut) : null,
        notes: notes || null,
      },
    });

    // تحديث الميزانية بناءً على التغييرات
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      select: { dailySalary: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "لم يتم العثور على الموظف" },
        { status: 404 }
      );
    }

    // خصم القيمة القديمة إذا كان هناك checkOut قديم
    if (oldAttendance.checkOut) {
      await updateEmployeeBudget(
        oldAttendance.employeeId,
        oldAttendance.checkIn,
        oldAttendance.checkOut,
        employee.dailySalary,
        "subtract"
      );
    }

    // إضافة القيمة الجديدة إذا كان هناك checkOut جديد
    if (checkOut) {
      await updateEmployeeBudget(
        parseInt(employeeId),
        new Date(checkIn),
        new Date(checkOut),
        employee.dailySalary,
        "add"
      );
    }

    return NextResponse.json(updatedAttendance, { status: 200 });
  } catch (error) {
    console.error("خطأ أثناء تعديل سجل الحضور:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعديل السجل" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// دالة DELETE لحذف سجل الحضور
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "معرف السجل مطلوب" }, { status: 400 });
    }

    // جلب السجل قبل الحذف لتحديث الميزانية
    const attendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id) },
      include: { employee: { select: { dailySalary: true } } },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "سجل الحضور غير موجود" },
        { status: 404 }
      );
    }

    // حذف السجل
    await prisma.attendance.delete({
      where: { id: parseInt(id) },
    });

    // خصم القيمة من الميزانية إذا كان هناك checkOut
    if (attendance.checkOut) {
      await updateEmployeeBudget(
        attendance.employeeId,
        attendance.checkIn,
        attendance.checkOut,
        attendance.employee.dailySalary,
        "subtract"
      );
    }

    return NextResponse.json(
      { message: "تم حذف السجل بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("خطأ أثناء حذف سجل الحضور:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف السجل" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
