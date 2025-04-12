import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { custodyId, amount } = await req.json();

    if (!custodyId || !amount) {
      return NextResponse.json(
        { error: "custodyId والمبلغ مطلوبان." },
        { status: 400 }
      );
    }

    // تحديث العهدة بزيادة الكمية
    const updatedCustody = await prisma.custody.update({
      where: { id: custodyId },
      data: {
        budget: { increment: amount },
        remaining: { increment: amount },
      },
    });

    // تسجيل العملية في جدول AddAmount
    await prisma.addAmount.create({
      data: {
        amount,
        custodyId,
      },
    });

    return NextResponse.json(updatedCustody, { status: 200 });
  } catch (error) {
    console.error("خطأ أثناء إضافة المبلغ:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة المبلغ." },
      { status: 500 }
    );
  }
}
