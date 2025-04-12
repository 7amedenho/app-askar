import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// تحديث حالة المعدة
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
    const { status, quantity } = body;

    // التحقق من صحة القيم المدخلة
    if (!status || !["available", "under_maintenance", "broken"].includes(status)) {
      return NextResponse.json(
        { error: "حالة المعدة غير صالحة" },
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

    // تحديث حالة المعدة
    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        status,
        quantity: quantity !== undefined ? parseInt(quantity) : existingEquipment.quantity,
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
    console.error("خطأ في تحديث حالة المعدة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث حالة المعدة" },
      { status: 500 }
    );
  }
} 