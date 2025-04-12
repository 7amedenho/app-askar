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

    // جلب سجلات الخصومات مع تطبيق الفلتر
    const deductions = await prisma.deduction.findMany({
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

    return NextResponse.json(deductions);
  } catch (error) {
    console.error("خطأ في جلب سجلات الخصومات:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب سجلات الخصومات" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, amount, date } = body;

    // التحقق من وجود جميع البيانات المطلوبة
    if (!employeeId || !amount || !date) {
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

    // إنشاء المعاملة لضمان تنفيذ جميع العمليات بنجاح أو فشلها جميعًا
    const result = await prisma.$transaction(async (prismaClient) => {
      // إنشاء سجل الخصم
      const deduction = await prismaClient.deduction.create({
        data: {
          employeeId,
          amount,
          date: new Date(date),
        },
      });

      // تحديث رصيد الموظف (خصم المبلغ)
      await prismaClient.employee.update({
        where: { id: employeeId },
        data: {
          budget: {
            decrement: Number(amount),
          },
        },
      });

      return deduction;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("خطأ في إنشاء سجل الخصم:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء سجل الخصم", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "معرف الخصم غير صالح" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { amount, date } = body;
    
    // التحقق من البيانات المطلوبة
    if (!body || !amount) {
      return NextResponse.json(
        { error: "البيانات غير صحيحة" },
        { status: 400 }
      );
    }
    
    // جلب سجل الخصم الحالي
    const currentDeduction = await prisma.deduction.findUnique({
      where: { id: Number(id) },
    });
    
    if (!currentDeduction) {
      return NextResponse.json(
        { error: "سجل الخصم غير موجود" },
        { status: 404 }
      );
    }
    
    // حساب الفرق بين المبلغ القديم والجديد
    const amountDifference = Number(amount) - Number(currentDeduction.amount);
    
    // إنشاء المعاملة لضمان تنفيذ جميع العمليات بنجاح أو فشلها جميعًا
    const result = await prisma.$transaction(async (prismaClient) => {
      // تحديث سجل الخصم
      const updatedDeduction = await prismaClient.deduction.update({
        where: { id: Number(id) },
        data: {
          amount,
          date: date ? new Date(date) : undefined,
        },
      });
      
      // تحديث رصيد الموظف إذا تغير المبلغ
      if (amountDifference !== 0) {
        await prismaClient.employee.update({
          where: { id: currentDeduction.employeeId },
          data: {
            budget: {
              // إذا كان الفرق موجب (زيادة المبلغ)، نقوم بخصم المزيد
              // إذا كان الفرق سالب (نقصان المبلغ)، نقوم بإضافة الفرق
              decrement: amountDifference,
            },
          },
        });
      }
      
      return updatedDeduction;
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("خطأ في تحديث سجل الخصم:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تحديث سجل الخصم", details: error.message },
      { status: 500 }
    );
  }
}
    