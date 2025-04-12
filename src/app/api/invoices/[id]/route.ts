import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// الحصول على فاتورة محددة بواسطة المعرف
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // التحقق من صحة المعرف
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف الفاتورة غير صالح" },
        { status: 400 }
      );
    }

    // البحث عن الفاتورة
    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "الفاتورة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("خطأ في جلب بيانات الفاتورة:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب بيانات الفاتورة" },
      { status: 500 }
    );
  }
}

// حذف فاتورة محددة
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // التحقق من صحة المعرف
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف الفاتورة غير صالح" },
        { status: 400 }
      );
    }

    // التحقق من وجود الفاتورة
    const existingInvoice = await prisma.supplierInvoice.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "الفاتورة غير موجودة" },
        { status: 404 }
      );
    }

    // حذف الفاتورة وعناصرها في معاملة واحدة
    await prisma.$transaction(async (prismaClient) => {
      // حذف عناصر الفاتورة
      await prismaClient.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // حذف الفاتورة
      await prismaClient.supplierInvoice.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      { message: "تم حذف الفاتورة بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("خطأ في حذف الفاتورة:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف الفاتورة" },
      { status: 500 }
    );
  }
}

// إنشاء تقرير PDF للفاتورة
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // التحقق من صحة المعرف
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف الفاتورة غير صالح" },
        { status: 400 }
      );
    }

    // البحث عن الفاتورة
    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "الفاتورة غير موجودة" },
        { status: 404 }
      );
    }

    // هنا يمكن إضافة كود لإنشاء ملف PDF للفاتورة
    // سيتم تنفيذ هذا في واجهة المستخدم باستخدام مكتبة مناسبة

    return NextResponse.json({
      message: "تم إنشاء تقرير الفاتورة بنجاح",
      invoice,
    });
  } catch (error) {
    console.error("خطأ في إنشاء تقرير الفاتورة:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء تقرير الفاتورة" },
      { status: 500 }
    );
  }
}