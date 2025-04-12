import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // استخراج startDate و endDate من query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // إعداد شروط التصفية بناءً على التاريخ
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate), // أكبر من أو يساوي تاريخ البداية
        lte: new Date(endDate),   // أقل من أو يساوي تاريخ النهاية
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

    // جلب سجلات المكافآت مع تطبيق الفلتر
    const bonuses = await prisma.bonus.findMany({
      where: dateFilter,
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
        date: "desc",
      },
    });

    return NextResponse.json(bonuses);
  } catch (error) {
    console.error("خطأ في جلب سجلات المكافآت:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب سجلات المكافآت" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, amount, reason, date, custodyId } = body;

    // التحقق من وجود جميع البيانات المطلوبة
    if (!employeeId || !amount || !reason || !date) {
      return NextResponse.json(
        { error: "جميع الحقول المطلوبة غير متوفرة" },
        { status: 400 }
      );
    }

    // التحقق من وجود الموظف
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "الموظف غير موجود" },
        { status: 404 }
      );
    }

    // التحقق من وجود العهدة إذا تم تحديدها
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

      // التحقق من كفاية رصيد العهدة
      if (custody.remaining < Number(amount)) {
        return NextResponse.json(
          { error: "رصيد العهدة غير كافٍ لإضافة المكافأة" },
          { status: 400 }
        );
      }
    }

    // إنشاء المعاملة لضمان تنفيذ جميع العمليات بنجاح أو فشلها جميعًا
    const result = await prisma.$transaction(async (prismaClient) => {
      // إنشاء سجل المكافأة
      const bonus = await prismaClient.bonus.create({
        data: {
          employeeId,
          amount,
          reason,
          date: new Date(date),
        },
      });

      // تحديث رصيد الموظف (إضافة مبلغ المكافأة)
      await prismaClient.employee.update({
        where: { id: employeeId },
        data: {
          budget: {
            increment: Number(amount),
          },
        },
      });

      // تحديث رصيد العهدة إذا تم تحديدها
      if (custodyId) {
        await prismaClient.custody.update({
          where: { id: custodyId },
          data: {
            remaining: {
              decrement: Number(amount),
            },
          },
        });

        // إنشاء مصروف للعهدة
        await prismaClient.expense.create({
          data: {
            description: `مكافأة للموظف: ${employee.name} - ${reason}`,
            amount,
            expenseType: "مكافأة",
            responsiblePerson: employee.name,
            custodyId,
            date: new Date(),
          },
        });
      }

      return bonus;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("خطأ في إنشاء سجل المكافأة:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء سجل المكافأة", details: error.message },
      { status: 500 }
    );
  }
}