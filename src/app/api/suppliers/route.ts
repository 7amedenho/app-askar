import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { invoices: true, payments: true },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل في جلب الموردين" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, phoneNumber, address } = data;

    if (!name || !phoneNumber || !address) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: { name, phoneNumber, address, balance: 0 },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل في إنشاء المورد" }, { status: 500 });
  }
}
