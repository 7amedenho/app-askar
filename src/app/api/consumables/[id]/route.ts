import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// الحصول على مستهلك محدد بواسطة المعرف
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // التحقق من صحة المعرف
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف المستهلك غير صالح" },
        { status: 400 }
      );
    }

    // البحث عن المستهلك
    const consumable = await prisma.consumableItem.findUnique({
      where: { id },
      include: {
        supplier: true,
        usages: {
          include: {
            project: true,
          },
          orderBy: {
            usedAt: "desc",
          },
        },
      },
    });

    if (!consumable) {
      return NextResponse.json(
        { error: "المستهلك غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(consumable);
  } catch (error) {
    console.error("خطأ في جلب بيانات المستهلك:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب بيانات المستهلك" },
      { status: 500 }
    );
  }
}

// تحديث بيانات مستهلك محدد
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const { name, unit, stock, supplierId } = body;

    // التحقق من صحة المعرف
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف المستهلك غير صالح" },
        { status: 400 }
      );
    }

    // التحقق من وجود المستهلك
    const existingConsumable = await prisma.consumableItem.findUnique({
      where: { id },
    });

    if (!existingConsumable) {
      return NextResponse.json(
        { error: "المستهلك غير موجود" },
        { status: 404 }
      );
    }

    // التحقق من وجود المورد إذا تم تغييره
    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });

      if (!supplier) {
        return NextResponse.json(
          { error: "المورد غير موجود" },
          { status: 404 }
        );
      }
    }

    // تحديث بيانات المستهلك
    const updatedConsumable = await prisma.consumableItem.update({
      where: { id },
      data: {
        name,
        unit,
        stock,
        supplierId,
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(updatedConsumable);
  } catch (error) {
    console.error("خطأ في تحديث بيانات المستهلك:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تحديث بيانات المستهلك" },
      { status: 500 }
    );
  }
}

// حذف مستهلك محدد
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // التحقق من صحة المعرف
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف المستهلك غير صالح" },
        { status: 400 }
      );
    }

    // التحقق من وجود المستهلك
    const existingConsumable = await prisma.consumableItem.findUnique({
      where: { id },
    });

    if (!existingConsumable) {
      return NextResponse.json(
        { error: "المستهلك غير موجود" },
        { status: 404 }
      );
    }

    // حذف المستهلك
    await prisma.consumableItem.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "تم حذف المستهلك بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("خطأ في حذف المستهلك:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف المستهلك" },
      { status: 500 }
    );
  }
}