import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// الحصول على عقد شركة محدد
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "معرف عقد الشركة غير صالح" },
        { status: 400 }
      );
    }

    const contract = await prisma.companyContract.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { message: "عقد الشركة غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error fetching company contract:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب عقد الشركة" },
      { status: 500 }
    );
  }
}

// تعديل عقد شركة
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, phoneNumber, address, email } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "معرف عقد الشركة غير صالح" },
        { status: 400 }
      );
    }

    // التحقق من وجود العقد
    const existingContract = await prisma.companyContract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      return NextResponse.json(
        { message: "عقد الشركة غير موجود" },
        { status: 404 }
      );
    }

    // تعديل العقد
    const updatedContract = await prisma.companyContract.update({
      where: { id },
      data: {
        name,
        phoneNumber,
        address,
        email,
      },
    });

    return NextResponse.json(updatedContract);
  } catch (error) {
    console.error("Error updating company contract:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تعديل عقد الشركة" },
      { status: 500 }
    );
  }
}

// حذف عقد شركة
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "معرف عقد الشركة غير صالح" },
        { status: 400 }
      );
    }

    // التحقق من وجود العقد
    const existingContract = await prisma.companyContract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      return NextResponse.json(
        { message: "عقد الشركة غير موجود" },
        { status: 404 }
      );
    }

    // حذف العقد (سيتم حذف المعاملات المرتبطة به تلقائيًا بسبب onDelete: Cascade)
    await prisma.companyContract.delete({
      where: { id },
    });

    return NextResponse.json({ message: "تم حذف عقد الشركة بنجاح" });
  } catch (error) {
    console.error("Error deleting company contract:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء حذف عقد الشركة" },
      { status: 500 }
    );
  }
}