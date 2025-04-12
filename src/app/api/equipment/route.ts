import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// جلب كل المعدات
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where = status ? { status } : undefined;

    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("خطأ في جلب المعدات:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المعدات" },
      { status: 500 }
    );
  }
}

// إضافة معدة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, quantity, brand, supplierId } = body;

    // التحقق من وجود البيانات المطلوبة
    if (!name || !code || !supplierId) {
      return NextResponse.json(
        { error: "يرجى توفير كل البيانات المطلوبة" },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود كود مكرر
    const existingEquipment = await prisma.equipment.findFirst({
      where: { code },
    });

    if (existingEquipment) {
      return NextResponse.json(
        { error: "كود المعدة موجود بالفعل" },
        { status: 400 }
      );
    }

    // إنشاء معدة جديدة
    const newEquipment = await prisma.equipment.create({
      data: {
        name,
        code,
        quantity: parseInt(quantity) || 0,
        brand,
        status: "available", // الحالة الافتراضية متاح
        supplierId: parseInt(supplierId),
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

    return NextResponse.json(newEquipment, { status: 201 });
  } catch (error) {
    console.error("خطأ في إضافة معدة جديدة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة معدة جديدة" },
      { status: 500 }
    );
  }
}
