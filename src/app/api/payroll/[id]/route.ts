import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف المرتب غير صالح" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      startDate,
      endDate,
      dailySalary,
      daysWorked,
      bonuses,
      deductions,
      advances,
      paidAmount,
    } = body;

    if (!dailySalary || !daysWorked || paidAmount === undefined) {
      return NextResponse.json(
        { error: "الراتب اليومي وعدد أيام العمل والمبلغ المصروف مطلوبان" },
        { status: 400 }
      );
    }

    const currentPayroll = await prisma.payroll.findUnique({
      where: { id },
      include: { employee: true }, // جلب بيانات الموظف للتحقق من الـ budget
    });

    if (!currentPayroll) {
      return NextResponse.json(
        { error: "سجل المرتب غير موجود" },
        { status: 404 }
      );
    }

    const totalSalary = dailySalary * daysWorked;
    const netSalary =
      totalSalary +
      Number(bonuses || 0) -
      Number(deductions || 0) -
      Number(advances || 0);

    // التحقق من أن الـ budget كافٍ للصرف
    const employeeBudget = currentPayroll.employee.budget;
    const paidAmountDifference = paidAmount - Number(currentPayroll.paidAmount);

    if (employeeBudget < paidAmountDifference) {
      return NextResponse.json(
        { error: "رصيد الموظف (Budget) غير كافٍ للصرف" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (prismaClient) => {
      const updatedPayroll = await prismaClient.payroll.update({
        where: { id },
        data: {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          dailySalary,
          daysWorked,
          totalSalary,
          bonuses: bonuses || 0,
          deductions: deductions || 0,
          advances: advances || 0,
          netSalary,
          paidAmount,
        },
      });

      if (paidAmountDifference !== 0) {
        await prismaClient.employee.update({
          where: { id: currentPayroll.employeeId },
          data: {
            budget: {
              decrement: paidAmountDifference, // خصم المبلغ من الـ budget
            },
          },
        });
      }

      return updatedPayroll;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("خطأ في تحديث سجل المرتب:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تحديث سجل المرتب", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف المرتب غير صالح" },
        { status: 400 }
      );
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id },
    });

    if (!payroll) {
      return NextResponse.json(
        { error: "سجل المرتب غير موجود" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (prismaClient) => {
      await prismaClient.payroll.delete({
        where: { id },
      });

      // إعادة المبلغ المصروف إلى الـ budget عند الحذف
      await prismaClient.employee.update({
        where: { id: payroll.employeeId },
        data: {
          budget: {
            increment: Number(payroll.paidAmount),
          },
        },
      });
    });

    return NextResponse.json({ message: "تم حذف سجل المرتب بنجاح" });
  } catch (error: any) {
    console.error("خطأ في حذف سجل المرتب:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف سجل المرتب", details: error.message },
      { status: 500 }
    );
  }
}
