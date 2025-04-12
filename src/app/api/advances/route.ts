import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // استخراج startDate و endDate من query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // إعداد شروط التصفية بناءً على التاريخ
    const dateFilter: {
      requestDate?: {
        gte?: Date;
        lte?: Date;
      }
    } = {};
    if (startDate && endDate) {
      dateFilter.requestDate = {
        gte: new Date(startDate), // أكبر من أو يساوي تاريخ البداية
        lte: new Date(endDate),   // أقل من أو يساوي تاريخ النهاية
      };
    } else if (startDate) {
      dateFilter.requestDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      dateFilter.requestDate = {
        lte: new Date(endDate),
      };
    }

    // جلب سجلات السلف مع تطبيق الفلتر
    const advances = await prisma.advance.findMany({
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
        requestDate: "desc",
      },
    });

    return NextResponse.json(advances);
  } catch (error) {
    console.error("خطأ في جلب سجلات السلف:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب سجلات السلف" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, amount, requestDate, status, custodyId } = body;

    // التحقق من وجود جميع البيانات المطلوبة
    if (!employeeId || !amount || !requestDate) {
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
          { error: "رصيد العهدة غير كافٍ لصرف السلفة" },
          { status: 400 }
        );
      }
    }

    // إنشاء المعاملة لضمان تنفيذ جميع العمليات بنجاح أو فشلها جميعًا
    const result = await prisma.$transaction(async (prismaClient) => {
      // إنشاء سجل السلفة
      const advance = await prismaClient.advance.create({
        data: {
          employeeId,
          amount,
          requestDate: new Date(requestDate),
          status: status || "pending",
        },
      });

      // تحديث رصيد الموظف (خصم مبلغ السلفة)
      await prismaClient.employee.update({
        where: { id: employeeId },
        data: {
          budget: {
            decrement: Number(amount),
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
            description: `سلفة للموظف: ${employee.name}`,
            amount,
            expenseType: "سلفة",
            responsiblePerson: employee.name,
            custodyId,
            date: new Date(),
          },
        });
      }

      return advance;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("خطأ في إنشاء سجل السلفة:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء سجل السلفة", details: errorMessage },
      { status: 500 }
    );
  }
}