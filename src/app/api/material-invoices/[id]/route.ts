import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for updating invoice status
const UpdateInvoiceStatusSchema = z.object({
  status: z.enum(["pending", "completed", "canceled"], {
    errorMap: () => ({ message: "حالة الفاتورة يجب أن تكون: معلقة، مكتملة، أو ملغاة" }),
  }),
});

// GET handler to fetch a specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف الفاتورة غير صالح" },
        { status: 400 }
      );
    }

    const invoice = await prisma.materialInvoice.findUnique({
      where: { id },
      include: {
        clientCompany: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "لم يتم العثور على الفاتورة" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching material invoice:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات الفاتورة" },
      { status: 500 }
    );
  }
}

// PATCH handler to update invoice status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف الفاتورة غير صالح" },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = UpdateInvoiceStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const invoice = await prisma.materialInvoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "لم يتم العثور على الفاتورة" },
        { status: 404 }
      );
    }

    // Update invoice status
    const updatedInvoice = await prisma.materialInvoice.update({
      where: { id },
      data: {
        status: body.status,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating material invoice:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث حالة الفاتورة" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف الفاتورة غير صالح" },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const invoice = await prisma.materialInvoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "لم يتم العثور على الفاتورة" },
        { status: 404 }
      );
    }

    // Delete invoice items first
    await prisma.materialInvoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    // Delete invoice
    await prisma.materialInvoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting material invoice:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الفاتورة" },
      { status: 500 }
    );
  }
} 