import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = parseInt(params.id);
    const data = await request.json();
    const { amount, notes } = data;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "المبلغ غير صالح" }, { status: 400 });
    }

    const payment = await prisma.supplierPayment.create({
      data: {
        supplierId,
        amount,
        notes,
      },
    });

    // تحديث رصيد المورد
    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل في إنشاء الدفعة" }, { status: 500 });
  }
}
