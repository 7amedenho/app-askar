import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// GET: جلب كل المستهلكات
export async function GET(request: NextRequest) {
  try {
    const consumables = await prisma.inventoryConsumable.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(consumables);
  } catch (error) {
    console.error("Error fetching inventory consumables:", error);
    return NextResponse.json(
      { error: "Error fetching inventory consumables" },
      { status: 500 }
    );
  }
}

// POST: إضافة مستهلك جديد
export async function POST(request: NextRequest) {
  try {


    const data = await request.json();
    const { name, code, unit, brand, stock, baseQuantity, supplierId } = data;

    // التحقق من تكرار الكود
    const existingConsumable = await prisma.inventoryConsumable.findUnique({
      where: { code },
    });

    if (existingConsumable) {
      return NextResponse.json(
        { error: "كود المستهلك موجود بالفعل" },
        { status: 400 }
      );
    }

    // إنشاء المستهلك الجديد
    const newConsumable = await prisma.inventoryConsumable.create({
      data: {
        name,
        code,
        unit,
        brand,
        stock: parseInt(stock),
        baseQuantity: parseInt(baseQuantity),
        supplier: supplierId
          ? {
            connect: { id: parseInt(supplierId) },
          }
          : undefined,
      },
    });

    return NextResponse.json(newConsumable, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory consumable:", error);
    return NextResponse.json(
      { error: "Error creating inventory consumable" },
      { status: 500 }
    );
  }
} 