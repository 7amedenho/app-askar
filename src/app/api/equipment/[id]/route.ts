import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// جلب معدة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف المعدة غير صالح" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json({ error: "المعدة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("خطأ في جلب المعدة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المعدة" },
      { status: 500 }
    );
  }
}

// تعديل معدة
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف المعدة غير صالح" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, code, quantity, brand, supplierId } = body;

    // التحقق من وجود المعدة
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "المعدة غير موجودة" },
        { status: 404 }
      );
    }

    // التحقق من عدم تكرار الكود مع معدة أخرى
    if (code !== existingEquipment.code) {
      const duplicateCode = await prisma.equipment.findFirst({
        where: { code, NOT: { id } },
      });

      if (duplicateCode) {
        return NextResponse.json(
          { error: "كود المعدة موجود بالفعل" },
          { status: 400 }
        );
      }
    }

    // تحديث المعدة
    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        name: name || existingEquipment.name,
        code: code || existingEquipment.code,
        quantity: quantity !== undefined ? parseInt(quantity) : existingEquipment.quantity,
        brand: brand !== undefined ? brand : existingEquipment.brand,
        supplierId: supplierId ? parseInt(supplierId) : existingEquipment.supplierId,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedEquipment);
  } catch (error) {
    console.error("خطأ في تعديل المعدة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعديل المعدة" },
      { status: 500 }
    );
  }
}

// حذف معدة
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف المعدة غير صالح" },
        { status: 400 }
      );
    }

    // التحقق من وجود المعدة
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "المعدة غير موجودة" },
        { status: 404 }
      );
    }

    // التحقق من عدم ارتباط المعدة بسجلات صيانة
    const maintenanceCount = await prisma.maintenance.count({
      where: { equipmentId: id },
    });

    if (maintenanceCount > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف المعدة لارتباطها بسجلات صيانة" },
        { status: 400 }
      );
    }

    // حذف المعدة
    await prisma.equipment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "تم حذف المعدة بنجاح" });
  } catch (error) {
    console.error("خطأ في حذف المعدة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المعدة" },
      { status: 500 }
    );
  }
}