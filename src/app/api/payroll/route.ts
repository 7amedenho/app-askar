import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filter: any = {};
    if (startDate && endDate) {
      filter.startDate = { gte: new Date(startDate) };
      filter.endDate = { lte: new Date(endDate) };
    }

    const payrolls = await prisma.payroll.findMany({
      where: filter,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            jobTitle: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(payrolls);
  } catch (error) {
    console.error("خطأ في جلب سجلات المرتبات:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب سجلات المرتبات" },
      { status: 500 }
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payrolls, custodyId, totalAmount } = body;

    if (!payrolls || !Array.isArray(payrolls) || payrolls.length === 0) {
      return NextResponse.json(
        { error: "بيانات المرتبات غير صحيحة" },
        { status: 400 }
      );
    }

    // التحقق من رصيد العهدة إذا تم توفير custodyId
    if (custodyId) {
      const custody = await prisma.custody.findUnique({
        where: { id: custodyId },
      });

      if (!custody) {
        return NextResponse.json(
          { error: "العهدة غير موجودة" },
          { status: 404 }
        );
      }

      if (custody.remaining < totalAmount) {
        return NextResponse.json(
          { error: "رصيد العهدة غير كافٍ لصرف المرتبات" },
          { status: 400 }
        );
      }
    }

    const result = await prisma.$transaction(async (prismaClient) => {
      const createdPayrolls = [];

      for (const payrollData of payrolls) {
        const {
          employeeId,
          startDate,
          endDate,
          dailySalary,
          daysWorked,
          totalSalary,
          bonuses,
          deductions,
          advances,
          netSalary,
          paidAmount,
        } = payrollData;

        const employee = await prismaClient.employee.findUnique({
          where: { id: employeeId },
        });

        if (!employee) {
          throw new Error(`الموظف برقم ${employeeId} غير موجود`);
        }

        // التحقق من أن الـ budget كافٍ للصرف
        if (employee.budget < paidAmount) {
          throw new Error(`رصيد الموظف ${employee.name} غير كافٍ للصرف`);
        }

        const payroll = await prismaClient.payroll.create({
          data: {
            employeeId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
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

        createdPayrolls.push(payroll);

        // خصم المبلغ المصروف من الـ budget
        await prismaClient.employee.update({
          where: { id: employeeId },
          data: {
            budget: {
              decrement: Number(paidAmount),
            },
          },
        });
      }

      if (custodyId) {
        await prismaClient.custody.update({
          where: { id: custodyId },
          data: {
            remaining: {
              decrement: totalAmount,
            },
          },
        });

        await prismaClient.expense.create({
          data: {
            description: `صرف مرتبات من ${payrolls[0].startDate} إلى ${payrolls[0].endDate}`,
            amount: totalAmount,
            expenseType: "مرتبات",
            responsiblePerson: "إدارة الموارد البشرية",
            custodyId,
            date: new Date(),
          },
        });
      }

      return createdPayrolls;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("خطأ في إنشاء سجلات المرتبات:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء سجلات المرتبات", details: error.message },
      { status: 500 }
    );
  }
}
