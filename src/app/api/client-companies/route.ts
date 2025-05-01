import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for creating a new client company
const CreateClientCompanySchema = z.object({
  name: z.string().min(1, "اسم الشركة مطلوب"),
  code: z.string().min(1, "كود الشركة مطلوب"),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email("بريد إلكتروني غير صالح").optional().nullable(),
  address: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
});

// GET handler to list all client companies
export async function GET() {
  try {
    const companies = await prisma.clientCompany.findMany({
      include: {
        invoices: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching client companies:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات الشركات" },
      { status: 500 }
    );
  }
}

// POST handler to create a new client company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CreateClientCompanySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if company code already exists
    const existingCompany = await prisma.clientCompany.findUnique({
      where: {
        code: body.code,
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "كود الشركة مستخدم بالفعل" },
        { status: 400 }
      );
    }

    // Create new client company
    const newCompany = await prisma.clientCompany.create({
      data: {
        name: body.name,
        code: body.code,
        phoneNumber: body.phoneNumber || null,
        email: body.email || null,
        address: body.address || null,
        contactName: body.contactName || null,
      },
    });

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error("Error creating client company:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الشركة" },
      { status: 500 }
    );
  }
} 