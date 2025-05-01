import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: جلب مستهلك محدد بواسطة المعرف
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
   
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const consumable = await prisma.inventoryConsumable.findUnique({
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

    if (!consumable) {
      return NextResponse.json({ error: "Consumable not found" }, { status: 404 });
    }

    return NextResponse.json(consumable);
  } catch (error) {
    console.error("Error fetching inventory consumable:", error);
    return NextResponse.json(
      { error: "Error fetching inventory consumable" },
      { status: 500 }
    );
  }
}

// PUT: تحديث مستهلك محدد
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
    const { name, code, unit, brand, stock, baseQuantity, supplierId } = data;

    // التحقق من وجود المستهلك
    const existingConsumable = await prisma.inventoryConsumable.findUnique({
      where: { id },
    });

    if (!existingConsumable) {
      return NextResponse.json(
        { error: "المستهلك غير موجود" },
        { status: 404 }
      );
    }

    // التحقق من تكرار الكود إذا تم تغييره
    if (code !== existingConsumable.code) {
      const codeExists = await prisma.inventoryConsumable.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "كود المستهلك موجود بالفعل" },
          { status: 400 }
        );
      }
    }

    // تحديث المستهلك
    const updatedConsumable = await prisma.inventoryConsumable.update({
      where: { id },
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
          : {
              disconnect: true,
            },
      },
    });

    return NextResponse.json(updatedConsumable);
  } catch (error) {
    console.error("Error updating inventory consumable:", error);
    return NextResponse.json(
      { error: "Error updating inventory consumable" },
      { status: 500 }
    );
  }
}

// DELETE: حذف مستهلك محدد
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // التحقق من ربط المستهلك بأي فواتير
    const invoiceItems = await prisma.materialInvoiceItem.findMany({
      where: {
        inventoryConsumableId: id,
      },
    });

    if (invoiceItems.length > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف المستهلك لأنه مرتبط بفواتير" },
        { status: 400 }
      );
    }

    // حذف المستهلك
    await prisma.inventoryConsumable.delete({
      where: { id },
    });

    return NextResponse.json({ message: "تم حذف المستهلك بنجاح" });
  } catch (error) {
    console.error("Error deleting inventory consumable:", error);
    return NextResponse.json(
      { error: "Error deleting inventory consumable" },
      { status: 500 }
    );
  }
} 