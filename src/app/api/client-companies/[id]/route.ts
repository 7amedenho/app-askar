import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for updating a client company
const UpdateClientCompanySchema = z.object({
  name: z.string().min(1, "اسم الشركة مطلوب"),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email("بريد إلكتروني غير صالح").optional().nullable(),
  address: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
});

// GET handler to fetch a specific client company
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف الشركة غير صالح" },
        { status: 400 }
      );
    }

    const company = await prisma.clientCompany.findUnique({
      where: { id },
      include: {
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            status: true,
            totalAmount: true,
          },
          orderBy: {
            createdAt: "desc"
          }
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "لم يتم العثور على الشركة" },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching client company:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات الشركة" },
      { status: 500 }
    );
  }
}

// PUT handler to update a client company
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف الشركة غير صالح" },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await prisma.clientCompany.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json(
        { error: "لم يتم العثور على الشركة" },
        { status: 404 }
      );
    }

    // Validate request body
    const validation = UpdateClientCompanySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Update company
    const updatedCompany = await prisma.clientCompany.update({
      where: { id },
      data: {
        name: body.name,
        phoneNumber: body.phoneNumber || null,
        email: body.email || null,
        address: body.address || null,
        contactName: body.contactName || null,
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("Error updating client company:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث بيانات الشركة" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a client company
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "معرف الشركة غير صالح" },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await prisma.clientCompany.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json(
        { error: "لم يتم العثور على الشركة" },
        { status: 404 }
      );
    }

    // Delete company - invoices will be cascade deleted due to the relation setup
    await prisma.clientCompany.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client company:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الشركة" },
      { status: 500 }
    );
  }
} 