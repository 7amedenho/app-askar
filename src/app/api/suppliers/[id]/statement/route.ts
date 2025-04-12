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
      },
    });

    const payments = await prisma.supplierPayment.findMany({
      where: { supplierId },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
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
