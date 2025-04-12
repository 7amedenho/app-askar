import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// الحصول على جميع الفواتير
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // إعداد شروط البحث
    const whereCondition: any = {};

    if (supplierId) {
      whereCondition.supplierId = parseInt(supplierId);
    }

    if (startDate && endDate) {
      whereCondition.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereCondition.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereCondition.createdAt = {
        lte: new Date(endDate),
      };
    }

    const invoices = await prisma.supplierInvoice.findMany({
      where: whereCondition,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("خطأ في جلب بيانات الفواتير:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب بيانات الفواتير" },
      { status: 500 }
    );
  }
}

// إضافة فاتورة جديدة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supplierId, invoiceType, items } = body;

    // التحقق من وجود جميع البيانات المطلوبة
    if (
      !supplierId ||
      !invoiceType ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "جميع الحقول المطلوبة غير متوفرة أو غير صحيحة" },
        { status: 400 }
      );
    }

    // التحقق من وجود المورد
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json({ error: "المورد غير موجود" }, { status: 404 });
    }

    // حساب إجمالي الفاتورة
    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    // إنشاء الفاتورة وعناصرها في معاملة واحدة
    const result = await prisma.$transaction(async (prismaClient) => {
      // إنشاء الفاتورة
      const invoice = await prismaClient.supplierInvoice.create({
        data: {
          supplierId,
          invoiceType,
          totalAmount,
          items: {
            create: items.map((item) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.price,
            })),
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      // تحديث المخزون للمعدات أو المستهلكات حسب نوع الفاتورة
      for (const item of items) {
        if (invoiceType === "equipment" && item.equipmentId) {
          // تحديث مخزون المعدات
          await prismaClient.equipment.update({
            where: { id: item.equipmentId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        } else if (invoiceType === "consumable" && item.consumableId) {
          // تحديث مخزون المستهلكات
          await prismaClient.consumableItem.update({
            where: { id: item.consumableId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return invoice;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("خطأ في إنشاء فاتورة جديدة:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء فاتورة جديدة", details: error.message },
      { status: 500 }
    );
  }
}
