import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف الخصم غير صالح" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { amount, date } = body;
    
    // التحقق من البيانات المطلوبة
    if (!amount) {
      return NextResponse.json(
        { error: "مبلغ الخصم مطلوب" },
        { status: 400 }
      );
    }
    
    // جلب سجل الخصم الحالي
    const currentDeduction = await prisma.deduction.findUnique({
      where: { id },
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
        where: { id },
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
              // إذا كان الفرق سالب (نقصان المبلغ)، نقوم بإضافة الفرق (لذلك نستخدم decrement)
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف الخصم غير صالح" },
        { status: 400 }
      );
    }
    
    // جلب سجل الخصم قبل الحذف
    const deduction = await prisma.deduction.findUnique({
      where: { id },
    });
    
    if (!deduction) {
      return NextResponse.json(
        { error: "سجل الخصم غير موجود" },
        { status: 404 }
      );
    }
    
    // إنشاء المعاملة لضمان تنفيذ جميع العمليات بنجاح أو فشلها جميعًا
    await prisma.$transaction(async (prismaClient) => {
      // حذف سجل الخصم
      await prismaClient.deduction.delete({
        where: { id },
      });
      
      // تحديث رصيد الموظف (إضافة مبلغ الخصم)
      await prismaClient.employee.update({
        where: { id: deduction.employeeId },
        data: {
          budget: {
            increment: Number(deduction.amount),
          },
        },
      });
    });
    
    return NextResponse.json({ message: "تم حذف سجل الخصم بنجاح" });
  } catch (error: any) {
    console.error("خطأ في حذف سجل الخصم:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف سجل الخصم", details: error.message },
      { status: 500 }
    );
  }
}