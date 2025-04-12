import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// توزيع المعدات العائدة من الصيانة
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف سجل الصيانة غير صالح" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { workingQuantity, brokenQuantity, pendingQuantity, notes } = body;

    // التحقق من صحة الكميات المدخلة
    const workingQty = parseInt(workingQuantity) || 0;
    const brokenQty = parseInt(brokenQuantity) || 0;
    const pendingQty = parseInt(pendingQuantity) || 0;

    if (workingQty < 0 || brokenQty < 0 || pendingQty < 0) {
      return NextResponse.json(
        { error: "الكميات المدخلة يجب أن تكون صفر أو أكبر" },
        { status: 400 }
      );
    }

    // التحقق من وجود سجل الصيانة
    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: { equipment: true },
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: "سجل الصيانة غير موجود" },
        { status: 404 }
      );
    }

    // التحقق من أن الكمية الكلية صحيحة
    const originalQuantity = maintenance.pendingQuantity || maintenance.equipment.quantity;
    if (workingQty + brokenQty + pendingQty !== originalQuantity) {
      return NextResponse.json(
        { error: "مجموع الكميات المدخلة لا يساوي الكمية الكلية" },
        { status: 400 }
      );
    }

    // تحديث سجل الصيانة وإضافة المعدات المصلحة للمخزون
    const [updatedMaintenance, updatedEquipment] = await prisma.$transaction([
      // تحديث سجل الصيانة
      prisma.maintenance.update({
        where: { id },
        data: {
          status: pendingQty > 0 ? "sent" : "returned",
          returnedQuantity: workingQty,
          brokenQuantity: brokenQty,
          pendingQuantity: pendingQty,
          notes: notes !== undefined ? notes : maintenance.notes,
        },
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              code: true,
              quantity: true,
            },
          },
        },
      }),
      // تحديث المعدة
      prisma.equipment.update({
        where: { id: maintenance.equipmentId },
        data: {
          quantity: maintenance.equipment.quantity + workingQty,
          status: workingQty > 0 ? "available" : maintenance.equipment.status,
        },
      }),
    ]);

    return NextResponse.json(updatedMaintenance);
  } catch (error) {
    console.error("خطأ في توزيع المعدات:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توزيع المعدات" },
      { status: 500 }
    );
  }
} 