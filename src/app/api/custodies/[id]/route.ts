import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id; // ✅ جلب id من البارامتر وليس من `searchParams`
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: "ID غير صالح" }, { status: 400 });
    }

    const deletedCustody = await prisma.custody.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json(
      { message: "تم حذف العهدة بنجاح", deletedCustody },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "حدث خطأ أثناء الحذف", details: error.message },
      { status: 500 }
    );
  }
}
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { name, code, company, budget, time, status } = await req.json();
    const updatedCustody = await prisma.custody.update({
      where: { id: Number(id) },
      data: {
        name,
        code,
        company,
        budget,
        remaining: budget,
        status, // تحديث الحالة
        time: new Date(time), // تحديث الوقت
      },
    });
    return NextResponse.json(updatedCustody);
  } catch (error: any) {
    return NextResponse.json(
      { error: "حدث خطأ في تحديث العهدة", details: error.message },
      { status: 500 }
    );
  }
}
