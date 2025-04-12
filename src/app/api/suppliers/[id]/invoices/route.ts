import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = parseInt(params.id);
    const data = await request.json();
    const { invoiceType, items } = data;

    if (!invoiceType || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "البيانات غير صالحة" },
        { status: 400 }
      );
    }

    // حساب المبلغ الإجمالي
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0
    );

    // إنشاء الفاتورة وعناصرها داخل معاملة
    const invoice = await prisma.$transaction(async (tx) => {
      const newInvoice = await tx.supplierInvoice.create({
        data: {
          supplierId,
          invoiceType,
          totalAmount,
          status: "pending",
        },
      });

      for (const item of items) {
        let equipmentId: number | null = null;
        let consumableId: number | null = null;

        // إذا كان الصنف جديدًا، أنشئه
        if (item.isNew) {
          if (invoiceType === "معدات") {
            const newEquipment = await tx.equipment.create({
              data: {
                name: item.itemName,
                code: `EQ-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2, 7)}`,
                quantity: item.quantity,
                brand: item.brand,
                supplierId,
                status: "available",
              },
            });
            equipmentId = newEquipment.id;
          } else if (invoiceType === "مستهلكات") {
            const newConsumable = await tx.consumableItem.create({
              data: {
                name: item.itemName,
                unit: item.unit,
                stock: item.quantity,
                brand: item.brand,
                supplierId,
              },
            });
            consumableId = newConsumable.id;
          }
        } else {
          // إذا كان الصنف موجودًا، قم بتحديث المخزون
          if (invoiceType === "معدات" && item.itemId) {
            await tx.equipment.update({
              where: { id: item.itemId },
              data: {
                quantity: { increment: item.quantity },
                brand: item.brand || undefined,
              },
            });
            equipmentId = item.itemId;
          } else if (invoiceType === "مستهلكات" && item.itemId) {
            await tx.consumableItem.update({
              where: { id: item.itemId },
              data: {
                stock: { increment: item.quantity },
                brand: item.brand || undefined,
              },
            });
            consumableId = item.itemId;
          }
        }

        // إنشاء عنصر الفاتورة
        await tx.invoiceItem.create({
          data: {
            invoiceId: newInvoice.id,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            brand: item.brand,
            equipmentId,
            consumableId,
          },
        });
      }

      // تحديث رصيد المورد
      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          balance: { increment: totalAmount },
        },
      });

      return newInvoice;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "فشل في إنشاء الفاتورة" },
      { status: 500 }
    );
  }
}
