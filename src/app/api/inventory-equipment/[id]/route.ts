import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: جلب معدة محددة بواسطة المعرف
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
   
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const equipment = await prisma.inventoryEquipment.findUnique({
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
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error fetching inventory equipment:", error);
    return NextResponse.json(
      { error: "Error fetching inventory equipment" },
      { status: 500 }
    );
  }
}

// PUT: تحديث معدة محددة
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
   

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const data = await request.json();
    const { name, code, brand, model, quantity, status, notes, supplierId } = data;

    // التحقق من وجود المعدة
    const existingEquipment = await prisma.inventoryEquipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "المعدة غير موجودة" },
        { status: 404 }
      );
    }

    // التحقق من تكرار الكود إذا تم تغييره
    if (code !== existingEquipment.code) {
      const codeExists = await prisma.inventoryEquipment.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "كود المعدة موجود بالفعل" },
          { status: 400 }
        );
      }
    }

    // تحديث المعدة
    const updatedEquipment = await prisma.inventoryEquipment.update({
      where: { id },
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
          : {
              disconnect: true,
            },
      },
    });

    return NextResponse.json(updatedEquipment);
  } catch (error) {
    console.error("Error updating inventory equipment:", error);
    return NextResponse.json(
      { error: "Error updating inventory equipment" },
      { status: 500 }
    );
  }
}

// DELETE: حذف معدة محددة
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
   

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // التحقق من ربط المعدة بأي فواتير
    const invoiceItems = await prisma.materialInvoiceItem.findMany({
      where: {
        inventoryEquipmentId: id,
      },
    });

    if (invoiceItems.length > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف المعدة لأنها مرتبطة بفواتير" },
        { status: 400 }
      );
    }

    // حذف المعدة
    await prisma.inventoryEquipment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "تم حذف المعدة بنجاح" });
  } catch (error) {
    console.error("Error deleting inventory equipment:", error);
    return NextResponse.json(
      { error: "Error deleting inventory equipment" },
      { status: 500 }
    );
  }
} 