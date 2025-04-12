import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف المكافأة غير صالح" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { amount, reason, date } = body;
    
    // التحقق من البيانات المطلوبة
    if (!amount) {
      return NextResponse.json(
        { error: "مبلغ المكافأة مطلوب" },
        { status: 400 }
      );
    }
    
    // جلب سجل المكافأة الحالي
    const currentBonus = await prisma.bonus.findUnique({
      where: { id },
    });
    
    if (!currentBonus) {
      return NextResponse.json(
        { error: "سجل المكافأة غير موجود" },
        { status: 404 }
      );
    }
    
    // حساب الفرق بين المبلغ القديم والجديد
    const amountDifference = Number(amount) - Number(currentBonus.amount);
    
    // إنشاء المعاملة لضمان تنفيذ جميع العمليات بنجاح أو فشلها جميعًا
    const result = await prisma.$transaction(async (prismaClient) => {
      // تحديث سجل المكافأة
      const updatedBonus = await prismaClient.bonus.update({
        where: { id },
        data: {
          amount,
          reason: reason || undefined,
          date: date ? new Date(date) : undefined,
        },
      });
      
      // تحديث رصيد الموظف إذا تغير المبلغ
      if (amountDifference !== 0) {
        await prismaClient.employee.update({
          where: { id: currentBonus.employeeId },
          data: {
            budget: {
              // إذا كان الفرق موجب (زيادة المبلغ)، نقوم بإضافة الفرق
              // إذا كان الفرق سالب (نقصان المبلغ)، نقوم بخصم الفرق
              increment: amountDifference,
            },
          },
        });
      }
      
      return updatedBonus;
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("خطأ في تحديث سجل المكافأة:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تحديث سجل المكافأة", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف المكافأة غير صالح" },
        { status: 400 }
      );
    }
    
    // جلب سجل المكافأة قبل الحذف
    const bonus = await prisma.bonus.findUnique({
      where: { id },
    });
    
    if (!bonus) {
      return NextResponse.json(
        { error: "سجل المكافأة غير موجود" },
        { status: 404 }
      );
    }
    
    // إنشاء المعاملة لضمان تنفيذ جميع العمليات بنجاح أو فشلها جميعًا
    await prisma.$transaction(async (prismaClient) => {
      // حذف سجل المكافأة
      await prismaClient.bonus.delete({
        where: { id },
      });
      
      // تحديث رصيد الموظف (خصم مبلغ المكافأة)
      await prismaClient.employee.update({
        where: { id: bonus.employeeId },
        data: {
          budget: {
            decrement: Number(bonus.amount),
          },
        },
      });
    });
    
    return NextResponse.json({ message: "تم حذف سجل المكافأة بنجاح" });
  } catch (error: any) {
    console.error("خطأ في حذف سجل المكافأة:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف سجل المكافأة", details: error.message },
      { status: 500 }
    );
  }
}