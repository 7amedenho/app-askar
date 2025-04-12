import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف السلفة غير صالح" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { amount, requestDate, status, repaymentAmount, repaymentDate } = body;
    
    // التحقق من البيانات المطلوبة
    if (!amount) {
      return NextResponse.json(
        { error: "مبلغ السلفة مطلوب" },
        { status: 400 }
      );
    }
    
    // جلب سجل السلفة الحالي
    const currentAdvance = await prisma.advance.findUnique({
      where: { id },
    });
    
    if (!currentAdvance) {
      return NextResponse.json(
        { error: "سجل السلفة غير موجود" },
        { status: 404 }
      );
    }
    
    // حساب الفرق بين المبلغ القديم والجديد
    const amountDifference = Number(amount) - Number(currentAdvance.amount);
    
    // إنشاء المعاملة لضمان تنفيذ جميع العمليات بنجاح أو فشلها جميعًا
    const result = await prisma.$transaction(async (prismaClient) => {
      // تحديث سجل السلفة
      const updatedAdvance = await prismaClient.advance.update({
        where: { id },
        data: {
          amount,
          requestDate: requestDate ? new Date(requestDate) : undefined,
          status,
          repaymentAmount,
          repaymentDate: repaymentDate ? new Date(repaymentDate) : undefined,
        },
      });
      
      // تحديث رصيد الموظف إذا تغير المبلغ
      if (amountDifference !== 0) {
        await prismaClient.employee.update({
          where: { id: currentAdvance.employeeId },
          data: {
            budget: {
              // إذا كان الفرق موجب (زيادة المبلغ)، نقوم بخصم الفرق
              // إذا كان الفرق سالب (نقصان المبلغ)، نقوم بإضافة الفرق (لذلك نستخدم decrement)
              decrement: amountDifference,
            },
          },
        });
      }
      
      // إذا تم تغيير الحالة إلى "تم السداد"، نقوم بإضافة المبلغ إلى رصيد الموظف
      if (status === "repaid" && currentAdvance.status !== "repaid") {
        await prismaClient.employee.update({
          where: { id: currentAdvance.employeeId },
          data: {
            budget: {
              increment: Number(amount),
            },
          },
        });
      }
      
      // إذا تم تغيير الحالة من "تم السداد" إلى حالة أخرى، نقوم بخصم المبلغ من رصيد الموظف
      if (status !== "repaid" && currentAdvance.status === "repaid") {
        await prismaClient.employee.update({
          where: { id: currentAdvance.employeeId },
          data: {
            budget: {
              decrement: Number(amount),
            },
          },
        });
      }
      
      return updatedAdvance;
    });
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("خطأ في تحديث سجل السلفة:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: "حدث خطأ في تحديث سجل السلفة", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف السلفة غير صالح" },
        { status: 400 }
      );
    }
    
    // جلب سجل السلفة قبل الحذف
    const advance = await prisma.advance.findUnique({
      where: { id },
    });
    
    if (!advance) {
      return NextResponse.json(
        { error: "سجل السلفة غير موجود" },
        { status: 404 }
      );
    }
    
    // إنشاء المعاملة لضمان تنفيذ جميع العمليات بنجاح أو فشلها جميعًا
    await prisma.$transaction(async (prismaClient) => {
      // حذف سجل السلفة
      await prismaClient.advance.delete({
        where: { id },
      });
      
      // إذا كانت حالة السلفة ليست "تم السداد"، نقوم بإضافة المبلغ إلى رصيد الموظف
      if (advance.status !== "repaid") {
        await prismaClient.employee.update({
          where: { id: advance.employeeId },
          data: {
            budget: {
              increment: Number(advance.amount),
            },
          },
        });
      }
    });
    
    return NextResponse.json({ message: "تم حذف سجل السلفة بنجاح" });
  } catch (error: unknown) {
    console.error("خطأ في حذف سجل السلفة:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: "حدث خطأ في حذف سجل السلفة", details: errorMessage },
      { status: 500 }
    );
  }
}