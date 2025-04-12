import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// جلب سجل صيانة محدد
export async function GET(
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

    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
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
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: "سجل الصيانة غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(maintenance);
  } catch (error) {
    console.error("خطأ في جلب سجل الصيانة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب سجل الصيانة" },
      { status: 500 }
    );
  }
}

// تحديث سجل صيانة
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
    const { status, notes } = body;

    // التحقق من صحة الحالة
    if (!status || !["sent", "returned", "fixed", "broken"].includes(status)) {
      return NextResponse.json(
        { error: "حالة الصيانة غير صالحة" },
        { status: 400 }
      );
    }

    // التحقق من وجود سجل الصيانة
    const existingMaintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: { equipment: true },
    });

    if (!existingMaintenance) {
      return NextResponse.json(
        { error: "سجل الصيانة غير موجود" },
        { status: 404 }
      );
    }

    // تحديث سجل الصيانة وحالة المعدة
    const [updatedMaintenance, updatedEquipment] = await prisma.$transaction([
      // تحديث سجل الصيانة
      prisma.maintenance.update({
        where: { id },
        data: {
          status,
          notes: notes !== undefined ? notes : existingMaintenance.notes,
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
      // تحديث حالة المعدة بناءً على حالة الصيانة
      prisma.equipment.update({
        where: { id: existingMaintenance.equipmentId },
        data: {
          status: status === "fixed" ? "available" : status === "broken" ? "broken" : existingMaintenance.equipment.status,
        },
      }),
    ]);

    return NextResponse.json(updatedMaintenance);
  } catch (error) {
    console.error("خطأ في تحديث سجل الصيانة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث سجل الصيانة" },
      { status: 500 }
    );
  }
}

// حذف سجل صيانة
export async function DELETE(
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

    // التحقق من وجود سجل الصيانة
    const existingMaintenance = await prisma.maintenance.findUnique({
      where: { id },
    });

    if (!existingMaintenance) {
      return NextResponse.json(
        { error: "سجل الصيانة غير موجود" },
        { status: 404 }
      );
    }

    // حذف سجل الصيانة
    await prisma.maintenance.delete({
      where: { id },
    });

    return NextResponse.json({ message: "تم حذف سجل الصيانة بنجاح" });
  } catch (error) {
    console.error("خطأ في حذف سجل الصيانة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف سجل الصيانة" },
      { status: 500 }
    );
  }
}