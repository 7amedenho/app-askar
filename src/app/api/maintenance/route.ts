import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";

// جلب سجلات الصيانة
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // إنشاء شروط البحث
    let where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    const maintenance = await prisma.maintenance.findMany({
      where,
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
      orderBy: { date: "desc" },
    });

    return NextResponse.json(maintenance);
  } catch (error) {
    console.error("خطأ في جلب سجلات الصيانة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب سجلات الصيانة" },
      { status: 500 }
    );
  }
}

// إضافة سجل صيانة جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { equipmentId, quantity, notes } = body;

    // التحقق من وجود البيانات المطلوبة
    if (!equipmentId || !quantity) {
      return NextResponse.json(
        { error: "يرجى توفير معرف المعدة والكمية" },
        { status: 400 }
      );
    }

    // التحقق من وجود المعدة
    const equipment = await prisma.equipment.findUnique({
      where: { id: parseInt(equipmentId) },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "المعدة غير موجودة" },
        { status: 404 }
      );
    }

    // التحقق من الكمية
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0 || parsedQuantity > equipment.quantity) {
      return NextResponse.json(
        { error: "الكمية غير صالحة أو تتجاوز الكمية المتاحة" },
        { status: 400 }
      );
    }

    // إنشاء سجل صيانة جديد وتحديث حالة المعدة
    const [newMaintenance, updatedEquipment] = await prisma.$transaction([
      // إنشاء سجل صيانة
      prisma.maintenance.create({
        data: {
          equipmentId: parseInt(equipmentId),
          status: "sent", // الحالة الافتراضية "تم الإرسال"
          date: new Date(),
          notes: notes || "",
          pendingQuantity: parsedQuantity,
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
      // تحديث حالة المعدة
      prisma.equipment.update({
        where: { id: parseInt(equipmentId) },
        data: {
          status: "under_maintenance",
          quantity: equipment.quantity - parsedQuantity,
        },
      }),
    ]);

    return NextResponse.json(newMaintenance, { status: 201 });
  } catch (error) {
    console.error("خطأ في إضافة سجل صيانة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة سجل صيانة" },
      { status: 500 }
    );
  }
}