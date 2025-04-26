import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// الحصول على معاملة شركة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "معرف المعاملة غير صالح" },
        { status: 400 }
      );
    }

    const transaction = await prisma.companyTransaction.findUnique({
      where: { id },
      include: {
        companyContract: {
          select: {
            name: true,
            phoneNumber: true,
            address: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "معاملة الشركة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error fetching company transaction:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب معاملة الشركة" },
      { status: 500 }
    );
  }
}

// تعديل معاملة شركة
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const {
      projectName,
      contractNumber,
      contractDate,
      fileOpenDate,
      fileNumber,
      percentage,
      contractValue,
      invoiceNumber,
      invoiceValue,
      certificateNumber,
      certificateDate,
      certificateValue,
      status,
    } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "معرف المعاملة غير صالح" },
        { status: 400 }
      );
    }

    // التحقق من وجود المعاملة
    const existingTransaction = await prisma.companyTransaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { message: "معاملة الشركة غير موجودة" },
        { status: 404 }
      );
    }

    // تعديل المعاملة
    const updatedTransaction = await prisma.companyTransaction.update({
      where: { id },
      data: {
        projectName,
        contractNumber,
        contractDate: new Date(contractDate),
        fileOpenDate: new Date(fileOpenDate),
        fileNumber,
        percentage: parseFloat(percentage),
        contractValue: parseFloat(contractValue),
        invoiceNumber,
        invoiceValue: invoiceValue ? parseFloat(invoiceValue) : null,
        certificateNumber,
        certificateDate: certificateDate ? new Date(certificateDate) : null,
        certificateValue: certificateValue ? parseFloat(certificateValue) : null,
        status,
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating company transaction:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تعديل معاملة الشركة" },
      { status: 500 }
    );
  }
}

// حذف معاملة شركة
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "معرف المعاملة غير صالح" },
        { status: 400 }
      );
    }

    // التحقق من وجود المعاملة
    const existingTransaction = await prisma.companyTransaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { message: "معاملة الشركة غير موجودة" },
        { status: 404 }
      );
    }

    // حذف المعاملة
    await prisma.companyTransaction.delete({
      where: { id },
    });

    return NextResponse.json({ message: "تم حذف معاملة الشركة بنجاح" });
  } catch (error) {
    console.error("Error deleting company transaction:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء حذف معاملة الشركة" },
      { status: 500 }
    );
  }
}