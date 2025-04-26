import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// الحصول على جميع معاملات الشركات
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const search = searchParams.get("search") || "";

    // إذا تم تحديد معرف الشركة، نجلب معاملات هذه الشركة فقط
    if (companyId) {
      const companyIdNum = parseInt(companyId);
      
      if (isNaN(companyIdNum)) {
        return NextResponse.json(
          { message: "معرف الشركة غير صالح" },
          { status: 400 }
        );
      }

      const transactions = await prisma.companyTransaction.findMany({
        where: {
          companyContractId: companyIdNum,
          OR: [
            { projectName: { contains: search } },
            { contractNumber: { contains: search } },
            { fileNumber: { contains: search } },
          ],
        },
        include: {
          companyContract: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(transactions);
    }

    // إذا لم يتم تحديد معرف الشركة، نجلب جميع المعاملات
    const transactions = await prisma.companyTransaction.findMany({
      where: {
        OR: [
          { projectName: { contains: search } },
          { contractNumber: { contains: search } },
          { fileNumber: { contains: search } },
        ],
      },
      include: {
        companyContract: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching company transactions:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب معاملات الشركات" },
      { status: 500 }
    );
  }
}

// إنشاء معاملة شركة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyContractId,
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

    // التحقق من البيانات المطلوبة
    if (!companyContractId || !projectName || !contractNumber || !contractDate || !fileOpenDate || !fileNumber || !percentage || !contractValue) {
      return NextResponse.json(
        { message: "جميع الحقول الأساسية مطلوبة" },
        { status: 400 }
      );
    }

    // التحقق من وجود الشركة
    const company = await prisma.companyContract.findUnique({
      where: { id: companyContractId },
    });

    if (!company) {
      return NextResponse.json(
        { message: "الشركة غير موجودة" },
        { status: 404 }
      );
    }

    // إنشاء معاملة جديدة
    const newTransaction = await prisma.companyTransaction.create({
      data: {
        companyContractId,
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
        status: status || "جارٍ التنفيذ",
      },
    });

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Error creating company transaction:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إنشاء معاملة الشركة" },
      { status: 500 }
    );
  }
}