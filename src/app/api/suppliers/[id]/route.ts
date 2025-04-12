import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    const { name, phoneNumber, address } = data;

    if (!name || !phoneNumber || !address) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, phoneNumber, address },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل في تعديل المورد" }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ message: "تم الحذف بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل في حذف المورد" }, { status: 500 });
  }
}
