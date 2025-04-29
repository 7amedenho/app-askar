import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = { supplierId };
    if (startDate && endDate) {
      where.invoiceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const invoices = await prisma.supplierInvoice.findMany({
      where,
      select: {
        id: true,
        invoiceType: true,
        totalAmount: true,
        invoiceDate: true,
        status: true,
        paidAmount: true,
        items: {
          select: {
            id: true,
            itemName: true,
            quantity: true,
            unitPrice: true,
            brand: true,
            equipment: {
              select: {
                id: true,
                name: true,
                code: true,
                brand: true,
              },
            },
            consumable: {
              select: {
                id: true,
                name: true,
                unit: true,
                brand: true,
              },
            },
          },
        },
      },
      orderBy: {
        invoiceDate: 'desc',
      },
    });

    const payments = await prisma.supplierPayment.findMany({
      where: { supplierId },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        notes: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    return NextResponse.json({ invoices, payments });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "فشل في جلب كشف الحساب" },
      { status: 500 }
    );
  }
}
