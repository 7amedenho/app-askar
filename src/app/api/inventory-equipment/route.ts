import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: جلب كل المعدات
export async function GET(request: NextRequest) {
  try {
    const equipment = await prisma.inventoryEquipment.findMany({
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

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error fetching inventory equipment:", error);
    return NextResponse.json(
      { error: "Error fetching inventory equipment" },
      { status: 500 }
    );
  }
}

// POST: إضافة معدة جديدة
export async function POST(request: NextRequest) {


  const data = await request.json();
  const { name, code, brand, model, quantity, status, notes, supplierId } = data;

  // التحقق من تكرار الكود
  const existingEquipment = await prisma.inventoryEquipment.findUnique({
    where: { code },
  });

  if (existingEquipment) {
    return NextResponse.json(
      { error: "كود المعدة موجود بالفعل" },
      { status: 400 }
    );
  }

  // إنشاء المعدة الجديدة
  const newEquipment = await prisma.inventoryEquipment.create({
    data: {
      name,
      code,
      brand,
      model,
      quantity: parseInt(quantity),
      status,
      notes,
      supplier: supplierId
        ? {
          connect: { id: parseInt(supplierId) },
        }
        : undefined,
    },
  });

  return NextResponse.json(newEquipment, { status: 201 });
} 
