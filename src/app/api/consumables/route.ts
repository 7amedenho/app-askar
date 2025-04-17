import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const consumables = await prisma.consumableItem.findMany({
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

    return NextResponse.json(consumables);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "فشل في جلب المستهلكات" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const { name, unit, brand, stock, supplierId } = data;

    // تحقق من الحقول الأساسية
    if (!name || !unit || !stock || !supplierId) {
      return NextResponse.json(
        { error: "يرجى تعبئة جميع الحقول المطلوبة" },
        { status: 400 }
      );
    }

    // إنشاء المستهلك
    const newConsumable = await prisma.consumableItem.create({
      data: {
        name,
        unit,
        brand,
        stock: Number(stock),
        supplier: { connect: { id: Number(supplierId) } },
      },
    });

    return NextResponse.json(newConsumable);
  } catch (error: any) {
    console.error("خطأ في API:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة المستهلك" },
      { status: 500 }
    );
  }
}
